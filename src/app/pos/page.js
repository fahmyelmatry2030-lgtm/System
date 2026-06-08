'use client';

import { useState, useEffect, useRef } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { formatCurrency } from '@/lib/currency';
import { withUser } from '@/lib/api-client';

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  const barcodeRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('erp_user');
    if (storedUser) setUser(JSON.parse(storedUser));
    
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/customers').then(r => r.json())
    ]).then(([prodData, custData]) => {
      setProducts(prodData.products || []);
      setCustomers(custData.customers || []);
    });
  }, []);

  // Handle barcode submission
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput) return;
    
    const product = products.find(p => p.sku === barcodeInput || p.id === barcodeInput);
    if (product) {
      addToCart(product);
    } else {
      alert('المنتج غير موجود');
    }
    setBarcodeInput('');
    barcodeRef.current?.focus();
  };

  const addToCart = (product) => {
    if (product.qty <= 0) {
      alert('الكمية نفدت من المخزون');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.qty) {
          alert('لا يوجد رصيد كافٍ من هذا المنتج');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1, price: product.sellPrice }];
    });
  };

  const updateCartQty = (id, newQty) => {
    if (newQty < 1) return;
    const product = products.find(p => p.id === id);
    if (product && newQty > product.qty) {
      alert('الكمية المطلوبة أكبر من المخزون');
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const finalTotal = calculateTotal() - discount;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('السلة فارغة');
    if (!customerId) return alert('يرجى اختيار العميل');

    setSaving(true);
    const customer = customers.find(c => c.id === customerId);
    
    const payload = {
      customerId: customer.id,
      customerName: customer.name,
      date: new Date().toISOString().split('T')[0],
      items: cart.map(item => ({
        productId: item.id,
        productName: item.name,
        qty: item.qty,
        price: item.price
      })),
      discount: discount,
      paidAmount: paidAmount,
      paymentStatus: paidAmount >= finalTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
      notes: 'تم البيع عبر نقطة البيع (POS)'
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withUser(payload))
      });
      if (res.ok) {
        alert('تم تسجيل عملية البيع بنجاح!');
        setCart([]);
        setDiscount(0);
        setPaidAmount(0);
        setCustomerId('');
        // Refresh products to update inventory
        const prodData = await fetch('/api/products').then(r => r.json());
        setProducts(prodData.products || []);
      } else {
        const err = await res.json();
        alert(err.error || 'حدث خطأ');
      }
    } catch (err) {
      alert('خطأ في الاتصال');
    }
    setSaving(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AuthGuard allowedRoles={['admin', 'rep']}>
      <div className="h-[calc(100vh-80px)] flex gap-4 overflow-hidden -m-4 p-4 bg-gray-50">
        
        {/* Left Side: Products Grid */}
        <div className="flex-1 flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-white z-10 flex gap-4">
            <form onSubmit={handleBarcodeSubmit} className="flex-1">
              <div className="relative">
                <input 
                  type="text" 
                  ref={barcodeRef}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="مرر الباركود هنا أو أدخله يدوياً..."
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  autoFocus
                />
                <span className="absolute right-3 top-3.5 text-gray-400">🔍</span>
              </div>
            </form>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الفئة..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(product => (
                <div 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`bg-white border ${product.qty > 0 ? 'border-gray-200 hover:border-blue-500 cursor-pointer' : 'border-red-200 opacity-50 cursor-not-allowed'} rounded-xl p-4 text-center transition-all hover:shadow-md flex flex-col justify-between h-32`}
                >
                  <h3 className="font-bold text-gray-800 text-sm line-clamp-2">{product.name}</h3>
                  <div className="mt-2">
                    <span className="block font-bold text-blue-600">{formatCurrency(product.sellPrice)}</span>
                    <span className="text-xs text-gray-500">متوفر: {product.qty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Cart Checkout */}
        <div className="w-[400px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full shrink-0">
          <div className="p-4 bg-gray-800 text-white rounded-t-2xl flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">🛒 سلة المشتريات</h2>
            <span className="bg-blue-600 px-2 py-1 rounded-lg text-sm">{cart.length} منتج</span>
          </div>

          <div className="p-4 border-b border-gray-100">
            <select 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">-- اختر العميل --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <span className="text-4xl mb-2">🛒</span>
                <p>السلة فارغة</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {cart.map(item => (
                  <li key={item.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-100">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-gray-800 truncate">{item.name}</h4>
                      <p className="text-xs text-blue-600 font-bold">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200" onClick={() => updateCartQty(item.id, item.qty + 1)}>+</button>
                        <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                        <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200" onClick={() => updateCartQty(item.id, item.qty - 1)}>-</button>
                      </div>
                      <button className="text-red-500 hover:text-red-700" onClick={() => removeFromCart(item.id)}>🗑️</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-gray-50 p-4 border-t border-gray-200 rounded-b-2xl">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>المجموع:</span>
                <span className="font-bold">{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>الخصم:</span>
                <input 
                  type="number" 
                  className="w-24 px-2 py-1 border border-gray-200 rounded text-left" 
                  value={discount} 
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>المدفوع:</span>
                <input 
                  type="number" 
                  className="w-24 px-2 py-1 border border-gray-200 rounded text-left" 
                  value={paidAmount} 
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-lg font-bold text-blue-600">
                <span>الإجمالي النهائي:</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
            </div>
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
              onClick={handleCheckout}
              disabled={saving || cart.length === 0}
            >
              {saving ? 'جاري الدفع...' : 'إتمام الدفع'} 💰
            </button>
          </div>
        </div>

      </div>
    </AuthGuard>
  );
}
