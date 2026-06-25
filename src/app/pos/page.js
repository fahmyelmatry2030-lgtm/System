'use client';

import { useState, useEffect, useRef } from 'react';
import AuthGuard from '@/components/AuthGuard';
import PrintInvoice from '@/components/PrintInvoice';
import { formatCurrency } from '@/lib/currency';
import { withUser } from '@/lib/api-client';
import { getIraqDateISO } from '@/lib/date-utils';

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [searchError, setSearchError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [invoiceRecord, setInvoiceRecord] = useState(null);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  
  const barcodeRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const storedUser = localStorage.getItem('erp_user');
      if (storedUser) setUser(JSON.parse(storedUser));
      
      try {
        const [prodRes, custRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/customers')
        ]);
        const prodData = await prodRes.json();
        const custData = await custRes.json();
        setProducts(prodData.products || []);
        setCustomers(custData.customers || []);
      } catch (error) {
        console.error(error);
      }
    };

    load();
  }, []);

  // Handle barcode submission
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput) return;

    const product = products.find(p => p.sku === barcodeInput || p.id === barcodeInput);
    if (!product) {
      setSearchError('المنتج غير موجود');
    } else if (product.qty <= 0) {
      setSearchError('الكمية نفدت من المخزون');
    } else {
      setSearchError('');
      addToCart(product);
    }

    setBarcodeInput('');
    barcodeRef.current?.focus();
  };

  const addToCart = (product) => {
    if (product.qty <= 0) {
      setSearchError('الكمية نفدت من المخزون');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.qty) {
          setSearchError('لا يوجد رصيد كافٍ من هذا المنتج');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1, price: product.sellPrice, total: product.sellPrice }];
    });
  };

  const handleSelectCustomer = (customer) => {
    setCustomerId(customer.id);
    setCustomerQuery(customer.name);
    setShowCustomerSuggestions(false);
  };

  const handleProductClick = (product) => {
    if (product.qty <= 0) {
      setSearchError('الكمية نفدت من المخزون');
      return;
    }
    setSearchError('');
    addToCart(product);
  };

  const customerSuggestions = customerQuery
    ? customers.filter(c => c.name.toLowerCase().includes(customerQuery.toLowerCase()))
    : [];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const displaySearchError = searchError || (searchQuery && filteredProducts.length === 0 ? 'المنتج غير موجود' : '');

  const searchInputBorderColor = displaySearchError ? 'border-red-500 bg-red-50' : 'border-gray-200';

  const updateCartQty = (id, newQty) => {
    if (newQty < 1) return;
    const product = products.find(p => p.id === id);
    if (product && newQty > product.qty) {
      alert('الكمية المطلوبة أكبر من المخزون');
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: newQty, total: item.price * newQty } : item));
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
      date: getIraqDateISO(),
      items: cart.map(item => ({
        productId: item.id,
        productName: item.name,
        qty: item.qty,
        price: item.price,
        purchasePrice: item.purchasePrice
      })),
      discount: discount,
      paidAmount: paidAmount,
      paymentMethod,
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
        const result = await res.json();
        const record = {
          id: result.id,
          date: payload.date,
          customerName: customer.name,
          customerPhone: customer.phone || 'غير متوفر',
          items: cart.map(item => ({
            productName: item.name,
            qty: item.qty,
            price: item.price,
            total: item.qty * item.price
          })),
          total: calculateTotal(),
          discount,
          paidAmount,
          paymentStatus: payload.paymentStatus,
          paymentMethod,
          cashOrCredit: paymentMethod === 'cash' ? 'نقدي' : 'قرض'
        };

        setInvoiceRecord(record);
        alert('تم تسجيل عملية البيع بنجاح!');
        setCart([]);
        setDiscount(0);
        setPaidAmount(0);
        setCustomerId('');
        setCustomerQuery('');
        setSearchError('');
        // Refresh products to update inventory
        const prodData = await fetch('/api/products').then(r => r.json());
        setProducts(prodData.products || []);
      } else {
        const err = await res.json();
        setSaveError(err.error || 'حدث خطأ');
        alert(err.error || 'حدث خطأ');
      }
    } catch (err) {
      alert('خطأ في الاتصال');
    }
    setSaving(false);
  };

  return (
    <AuthGuard allowedRoles={['admin', 'rep']}>
      <div className="h-[calc(100vh-80px)] flex gap-4 overflow-hidden -m-4 p-4 bg-gray-50">
        
        {/* Left Side: Products Grid */}
        <div className="flex-1 flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-white z-10 grid gap-4 sm:grid-cols-[1fr_1.5fr]">
            <form onSubmit={handleBarcodeSubmit} className="flex-1">
              <div className="relative">
                <input 
                  type="text" 
                  ref={barcodeRef}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="مرر الباركود هنا أو أدخله يدوياً..."
                  className={`w-full pl-4 pr-10 py-3 rounded-xl border-2 ${displaySearchError ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 ${displaySearchError ? 'focus:ring-red-400' : 'focus:ring-blue-500'} bg-gray-50`}
                  autoFocus
                />
                <span className="absolute right-3 top-3.5 text-gray-400">🔍</span>
              </div>
              {displaySearchError && (
                <p className="mt-2 text-sm text-red-600 font-bold">{displaySearchError}</p>
              )}
            </form>
            <div className="relative flex-1">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError('');
                }}
                placeholder="ابحث بالاسم أو الفئة..."
                className={`w-full px-4 py-3 rounded-xl border-2 ${displaySearchError ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 ${displaySearchError ? 'focus:ring-red-400' : 'focus:ring-blue-500'} bg-gray-50`}
              />
              {displaySearchError && (
                <p className="mt-2 text-sm text-red-600 font-bold">{displaySearchError}</p>
              )}
            </div>
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

          <div className="p-4 border-b border-gray-100 relative">
            <label className="block mb-2 text-sm font-semibold text-gray-700">اختر العميل 👤</label>
            <div className="relative">
              <input
                type="text"
                value={customerQuery}
                onChange={(e) => {
                  setCustomerQuery(e.target.value);
                  setShowCustomerSuggestions(true);
                }}
                onFocus={() => setShowCustomerSuggestions(true)}
                onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                placeholder="اكتب اسم العميل للبحث..."
                className={`w-full px-4 py-3 border-2 ${!customerId && customerQuery === '' ? 'border-gray-200' : customerId ? 'border-green-500 bg-green-50' : 'border-blue-300'} rounded-xl focus:outline-none focus:border-blue-500 bg-white font-semibold transition-colors`}
              />
              {showCustomerSuggestions && customerSuggestions.length > 0 && (
                <div className="absolute left-4 right-4 mt-2 max-h-48 overflow-y-auto bg-white border-2 border-blue-300 rounded-xl shadow-lg z-20">
                  {customerSuggestions.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => handleSelectCustomer(c)}
                      className="w-full text-right px-4 py-3 hover:bg-blue-100 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-bold text-gray-800">{c.name}</div>
                      <div className="text-xs text-gray-500">📱 {c.phone || 'لا يوجد رقم هاتف'}</div>
                    </button>
                  ))}
                </div>
              )}
              {customerQuery && customerSuggestions.length === 0 && (
                <div className="absolute left-4 right-4 mt-2 bg-red-50 border-2 border-red-300 rounded-xl p-3 z-20 text-right">
                  <p className="text-sm text-red-600 font-semibold">❌ لا توجد عملاء بهذا الاسم</p>
                </div>
              )}
            </div>
            {customerId && (
              <p className="mt-2 text-sm text-green-600 font-semibold">✅ تم اختيار: {customerQuery}</p>
            )}
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
                  <li key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-800 truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">سعر الوحدة: {formatCurrency(item.price)}</p>
                        <p className="text-xs text-gray-500">الإجمالي: {formatCurrency(item.total || item.price * item.qty)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200" onClick={() => updateCartQty(item.id, item.qty + 1)}>+</button>
                          <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                          <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200" onClick={() => updateCartQty(item.id, item.qty - 1)}>-</button>
                        </div>
                        <button className="text-red-500 hover:text-red-700" onClick={() => removeFromCart(item.id)}>🗑️</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-gray-50 p-4 border-t border-gray-200 rounded-b-2xl">
            <div className="space-y-3 mb-4 bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">المجموع الفرعي:</span>
                <span className="font-bold text-blue-600 text-lg">{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">الخصم:</span>
                <input 
                  type="number" 
                  className="w-28 px-2 py-1 border-2 border-orange-300 rounded-lg text-left font-bold" 
                  value={discount} 
                  onChange={(e) => {
                    let val = parseFloat(e.target.value) || 0;
                    if (user?.role === 'rep') {
                      const totalCost = cart.reduce((sum, item) => sum + ((item.purchasePrice || item.price) * item.qty), 0);
                      const maxDiscount = Math.max(0, calculateTotal() - totalCost);
                      if (val > maxDiscount) {
                        alert(`تجاوزت الحد الأقصى للخصم المسموح! الحد الأقصى هو ${maxDiscount}`);
                        val = maxDiscount;
                      }
                    }
                    setDiscount(Math.min(calculateTotal(), Math.max(0, val)));
                  }} 
                />
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">المدفوع:</span>
                <input 
                  type="number" 
                  className="w-28 px-2 py-1 border-2 border-green-300 rounded-lg text-left font-bold" 
                  value={paidAmount} 
                  onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))} 
                />
              </div>
              <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">نوع الدفع:</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-32 px-2 py-1 border-2 border-purple-300 rounded-lg text-right font-semibold"
                >
                  <option value="cash">💰 نقدي</option>
                  <option value="credit">📝 قرض</option>
                </select>
              </div>
              <div className="flex justify-between items-center p-3 border-t-2 border-gray-200 pt-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
                <span>الإجمالي النهائي:</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
            </div>
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCheckout}
              disabled={saving || cart.length === 0 || !customerId}
            >
              {saving ? '⏳ جاري الدفع...' : '💰 إتمام الدفع'} 
            </button>
            {invoiceRecord && (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-right">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-blue-700">الفاتورة جاهزة للطباعة</p>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm"
                  >
                    طباعة الفاتورة
                  </button>
                </div>
                <p className="text-sm text-blue-700 mt-2">رقم الفاتورة: {invoiceRecord.id}</p>
              </div>
            )}
          </div>
        </div>

      </div>
      {invoiceRecord && (
        <div className="mt-6">
          <PrintInvoice record={invoiceRecord} />
        </div>
      )}
    </AuthGuard>
  );
}
