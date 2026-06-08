'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import { exportToExcel } from '@/lib/export';
import { formatCurrency } from '@/lib/currency';
import { getStoredUser } from '@/lib/api-client';

export default function Reports() {
  const [reportType, setReportType] = useState('financial'); // financial, inventory, debt, sales, purchases, stocktake, damaged, collections
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [user, setUser] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    const load = () => {
      setUser(getStoredUser());
    };

    load();
  }, []);

  const handleBackup = async () => {
    if (!user || !['admin', 'accountant'].includes(user.role)) {
      alert('هذه العملية متاحة للمدير والمحاسب فقط');
      return;
    }
    setBackupLoading(true);
    try {
      const res = await fetch(`/api/backup?role=${user.role}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل التنزيل');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `erp-backup-${new Date().toISOString().slice(0, 10)}.sqlite`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const fetchReport = useCallback(async (type) => {
    setLoading(true);
    try {
      let url = `/api/reports?type=${type}`;
      if (type === 'sales' && dateRange.startDate && dateRange.endDate) {
        url += `&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    const load = async () => {
      await fetchReport(reportType);
    };

    load();
  }, [reportType, dateRange, fetchReport]);

  const renderFinancialReport = () => {
    if (!data) return null;
    return (
      <div className="animate-slide">
        <h2 style={{ marginBottom: '20px', color: 'var(--text-heading)' }}>ملخص مالي شامل (الأرباح والخسائر)</h2>
        <div className="stats-grid">
          <StatsCard title="إجمالي المبيعات" value={formatCurrency(data.totalSales || 0)} color="indigo" />
          <StatsCard title="إجمالي المشتريات" value={formatCurrency(data.totalPurchases || 0)} color="orange" />
          <StatsCard title="المصروفات" value={formatCurrency(data.totalExpenses || 0)} color="red" />
          <StatsCard title="خسائر التوالف" value={formatCurrency(data.totalDamaged || 0)} color="red" />
        </div>
        
        <div className="card" style={{ marginTop: '20px', textAlign: 'center', padding: '40px' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>صافي الربح التقديري (قبل الضريبة)</h3>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: data.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {data.netProfit >= 0 ? '+' : ''}{formatCurrency(data.netProfit || 0)}
          </div>
          <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            معادلة الحساب: (المبيعات - المشتريات - المصروفات - خسائر التوالف)
          </p>
        </div>
      </div>
    );
  };

  const renderInventoryReport = () => {
    if (!data) return null;
    return (
      <div className="animate-slide">
        <h2 style={{ marginBottom: '20px', color: 'var(--text-heading)' }}>تقارير المخزون</h2>
        <div className="grid-2" style={{ marginBottom: '24px' }}>
          <StatsCard title="إجمالي الأصناف المسجلة" value={data.products?.count || 0} color="blue" />
          <StatsCard title="قيمة المخزون المقدرة (بالتكلفة)" value={formatCurrency(data.products?.value || 0)} color="indigo" />
        </div>
        
        <div className="card">
          <div className="flex justify-between mb-4">
            <h3 style={{ color: 'var(--danger)' }}>أصناف تجاوزت الحد الأدنى (تحتاج طلب)</h3>
            <button className="btn btn-secondary text-xs" onClick={() => exportToExcel(data.lowStock, 'النواقص')}>تصدير Excel 📊</button>
          </div>
          {data.lowStock?.length > 0 ? (
            <table style={{ width: '100%', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 0' }}>المنتج</th>
                  <th style={{ padding: '10px 0' }}>الفئة</th>
                  <th style={{ padding: '10px 0' }}>الرصيد الحالي</th>
                  <th style={{ padding: '10px 0' }}>حد الطلب (Threshold)</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 0' }}>{p.name}</td>
                    <td style={{ padding: '10px 0' }}>{p.category}</td>
                    <td style={{ padding: '10px 0', color: 'var(--danger)', fontWeight: 'bold' }}>{p.qty}</td>
                    <td style={{ padding: '10px 0' }}>{p.threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>لا توجد منتجات منخفضة الرصيد حالياً</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDebtReport = () => {
    if (!data) return null;
    return (
      <div className="animate-slide">
        <h2 style={{ marginBottom: '20px', color: 'var(--text-heading)' }}>تقارير المديونيات والأرصدة</h2>
        
        <div className="grid-2">
          <div className="card">
            <div className="flex justify-between mb-4">
              <h3 style={{ color: 'var(--success)' }}>ديون لنا (عملاء)</h3>
              <button className="btn btn-secondary text-xs" onClick={() => exportToExcel(data.customers, 'ديون_العملاء')}>تصدير Excel 📊</button>
            </div>
            {data.customers?.length > 0 ? (
              <table style={{ width: '100%', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 0' }}>العميل</th>
                    <th style={{ padding: '10px 0' }}>المبلغ المستحق</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customers.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 0' }}>{c.name}</td>
                      <td style={{ padding: '10px 0', color: 'var(--success)', fontWeight: 'bold' }}>{formatCurrency(c.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>لا توجد مديونيات على العملاء</p>
            )}
          </div>

          <div className="card">
            <div className="flex justify-between mb-4">
              <h3 style={{ color: 'var(--danger)' }}>ديون علينا (موردين)</h3>
              <button className="btn btn-secondary text-xs" onClick={() => exportToExcel(data.suppliers, 'ديون_الموردين')}>تصدير Excel 📊</button>
            </div>
            {data.suppliers?.length > 0 ? (
              <table style={{ width: '100%', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 0' }}>المورد</th>
                    <th style={{ padding: '10px 0' }}>المبلغ المطلوب</th>
                  </tr>
                </thead>
                <tbody>
                  {data.suppliers.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 0' }}>{s.name}</td>
                      <td style={{ padding: '10px 0', color: 'var(--danger)', fontWeight: 'bold' }}>{formatCurrency(s.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>لا توجد مديونيات للموردين</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSalesReport = () => {
    if (!data) return null;
    return (
      <div className="animate-slide">
        <h2 style={{ marginBottom: '20px', color: 'var(--text-heading)' }}>تقارير المبيعات</h2>
        
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>تصفية حسب الفترة الزمنية</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">من تاريخ</label>
              <input 
                type="date" 
                className="form-input" 
                value={dateRange.startDate} 
                onChange={e => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">إلى تاريخ</label>
              <input 
                type="date" 
                className="form-input" 
                value={dateRange.endDate} 
                onChange={e => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
            <div className="form-group">
              <button className="btn btn-primary" onClick={() => fetchReport('sales')}>تطبيق</button>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <StatsCard title="عدد الفواتير" value={data.sales?.length || 0} color="blue" />
          <StatsCard title="إجمالي المبيعات" value={formatCurrency(data.totalSales || 0)} color="indigo" />
          <StatsCard title="المبالغ المدفوعة" value={formatCurrency(data.totalPaid || 0)} color="green" />
          <StatsCard title="المبالغ المتبقية" value={formatCurrency(data.totalRemaining || 0)} color="orange" />
        </div>

        <div className="card" style={{ marginTop: '20px' }}>
          <div className="flex justify-between mb-4">
            <h3>المبيعات حسب المندوب</h3>
            <button className="btn btn-secondary text-xs" onClick={() => exportToExcel(data.byRep, 'مبيعات_المناديب')}>تصدير Excel 📊</button>
          </div>
          {data.byRep?.length > 0 ? (
            <table style={{ width: '100%', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 0' }}>المندوب</th>
                  <th style={{ padding: '10px 0' }}>عدد الفواتير</th>
                  <th style={{ padding: '10px 0' }}>إجمالي المبيعات</th>
                </tr>
              </thead>
              <tbody>
                {data.byRep.map((rep, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 0' }}>{rep.repName || 'غير محدد'}</td>
                    <td style={{ padding: '10px 0' }}>{rep.count}</td>
                    <td style={{ padding: '10px 0', fontWeight: 'bold' }}>{formatCurrency(rep.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>لا توجد بيانات</p>
          )}
        </div>
      </div>
    );
  };

  const renderPurchasesReport = () => {
    if (!data) return null;
    return (
      <div className="animate-slide">
        <h2 style={{ marginBottom: '20px', color: 'var(--text-heading)' }}>تقارير المشتريات</h2>
        
        <div className="stats-grid">
          <StatsCard title="عدد الفواتير" value={data.purchases?.length || 0} color="blue" />
          <StatsCard title="إجمالي المشتريات" value={formatCurrency(data.totalPurchases || 0)} color="orange" />
          <StatsCard title="المبالغ المدفوعة" value={formatCurrency(data.totalPaid || 0)} color="green" />
          <StatsCard title="المبالغ المتبقية" value={formatCurrency(data.totalRemaining || 0)} color="red" />
        </div>

        <div className="card" style={{ marginTop: '20px' }}>
          <div className="flex justify-between mb-4">
            <h3>المشتريات حسب المورد</h3>
            <button className="btn btn-secondary text-xs" onClick={() => exportToExcel(data.bySupplier, 'مشتريات_الموردين')}>تصدير Excel 📊</button>
          </div>
          {data.bySupplier?.length > 0 ? (
            <table style={{ width: '100%', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 0' }}>المورد</th>
                  <th style={{ padding: '10px 0' }}>عدد الفواتير</th>
                  <th style={{ padding: '10px 0' }}>إجمالي المشتريات</th>
                </tr>
              </thead>
              <tbody>
                {data.bySupplier.map((sup, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 0' }}>{sup.supplierName}</td>
                    <td style={{ padding: '10px 0' }}>{sup.count}</td>
                    <td style={{ padding: '10px 0', fontWeight: 'bold' }}>{formatCurrency(sup.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>لا توجد بيانات</p>
          )}
        </div>
      </div>
    );
  };

  const renderStocktakeReport = () => {
    if (!data) return null;
    return (
      <div className="animate-slide">
        <h2 style={{ marginBottom: '20px', color: 'var(--text-heading)' }}>تقارير جرد المخزون</h2>
        
        <div className="stats-grid">
          <StatsCard title="عدد عمليات الجرد" value={data.stocktakes?.length || 0} color="blue" />
          <StatsCard title="فائض" value={formatCurrency(data.surplus || 0)} color="green" />
          <StatsCard title="عجز" value={formatCurrency(data.deficit || 0)} color="red" />
        </div>

        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>سجل عمليات الجرد</h3>
          {data.stocktakes?.length > 0 ? (
            <table style={{ width: '100%', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 0' }}>التاريخ</th>
                  <th style={{ padding: '10px 0' }}>المنتج</th>
                  <th style={{ padding: '10px 0' }}>الكمية المسجلة</th>
                  <th style={{ padding: '10px 0' }}>الكمية الفعلية</th>
                  <th style={{ padding: '10px 0' }}>الفرق</th>
                  <th style={{ padding: '10px 0' }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {data.stocktakes.map((st, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 0' }}>{st.date}</td>
                    <td style={{ padding: '10px 0' }}>{st.productName}</td>
                    <td style={{ padding: '10px 0' }}>{st.systemQty}</td>
                    <td style={{ padding: '10px 0' }}>{st.physicalQty}</td>
                    <td style={{ padding: '10px 0', fontWeight: 'bold' }}>{st.difference}</td>
                    <td style={{ padding: '10px 0' }}>
                      <span className={`badge ${st.status === 'matching' ? 'badge-success' : st.status === 'surplus' ? 'badge-info' : 'badge-danger'}`}>
                        {st.status === 'matching' ? 'مطابق' : st.status === 'surplus' ? 'فائض' : 'عجز'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>لا توجد عمليات جرد مسجلة</p>
          )}
        </div>
      </div>
    );
  };

  const renderDamagedReport = () => {
    if (!data) return null;
    return (
      <div className="animate-slide">
        <h2 style={{ marginBottom: '20px', color: 'var(--text-heading)' }}>تقارير المواد التالفة والمنتهية الصلاحية</h2>
        
        <div className="stats-grid">
          <StatsCard title="عدد الحوادث" value={data.damaged?.length || 0} color="red" />
          <StatsCard title="إجمالي الخسائر" value={formatCurrency(data.totalLoss || 0)} color="orange" />
        </div>

        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>سجل المواد التالفة</h3>
          {data.damaged?.length > 0 ? (
            <table style={{ width: '100%', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 0' }}>التاريخ</th>
                  <th style={{ padding: '10px 0' }}>المنتج</th>
                  <th style={{ padding: '10px 0' }}>الكمية</th>
                  <th style={{ padding: '10px 0' }}>النوع</th>
                  <th style={{ padding: '10px 0' }}>السبب</th>
                  <th style={{ padding: '10px 0' }}>قيمة الخسارة</th>
                </tr>
              </thead>
              <tbody>
                {data.damaged.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 0' }}>{d.date}</td>
                    <td style={{ padding: '10px 0' }}>{d.productName}</td>
                    <td style={{ padding: '10px 0' }}>{d.qty}</td>
                    <td style={{ padding: '10px 0' }}>{d.type}</td>
                    <td style={{ padding: '10px 0' }}>{d.reason}</td>
                    <td style={{ padding: '10px 0', color: 'var(--danger)', fontWeight: 'bold' }}>{formatCurrency(d.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>لا توجد مواد تالفة مسجلة</p>
          )}
        </div>

        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--danger)' }}>منتجات منتهية الصلاحية</h3>
          {data.expired?.length > 0 ? (
            <table style={{ width: '100%', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 0' }}>المنتج</th>
                  <th style={{ padding: '10px 0' }}>تاريخ الانتهاء</th>
                  <th style={{ padding: '10px 0' }}>الكمية</th>
                </tr>
              </thead>
              <tbody>
                {data.expired.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 0' }}>{p.name}</td>
                    <td style={{ padding: '10px 0', color: 'var(--danger)', fontWeight: 'bold' }}>{p.expiryDate}</td>
                    <td style={{ padding: '10px 0' }}>{p.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>لا توجد منتجات منتهية الصلاحية</p>
          )}
        </div>
      </div>
    );
  };

  const renderCollectionsReport = () => {
    if (!data) return null;
    return (
      <div className="animate-slide">
        <h2 style={{ marginBottom: '20px', color: 'var(--text-heading)' }}>تقارير التحصيلات والمديونيات</h2>
        
        <div className="stats-grid">
          <StatsCard title="عدد سندات القبض" value={data.collections?.length || 0} color="blue" />
          <StatsCard title="إجمالي المحصل" value={formatCurrency(data.totalCollected || 0)} color="green" />
          <StatsCard title="إجمالي الديون المستحقة" value={formatCurrency(data.totalDebt || 0)} color="orange" />
        </div>

        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>سندات القبض الأخيرة</h3>
          {data.collections?.length > 0 ? (
            <table style={{ width: '100%', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 0' }}>التاريخ</th>
                  <th style={{ padding: '10px 0' }}>العميل</th>
                  <th style={{ padding: '10px 0' }}>المبلغ</th>
                  <th style={{ padding: '10px 0' }}>طريقة الدفع</th>
                  <th style={{ padding: '10px 0' }}>المندوب</th>
                </tr>
              </thead>
              <tbody>
                {data.collections.slice(0, 20).map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 0' }}>{c.date}</td>
                    <td style={{ padding: '10px 0' }}>{c.customerName}</td>
                    <td style={{ padding: '10px 0', fontWeight: 'bold' }}>{formatCurrency(c.amount)}</td>
                    <td style={{ padding: '10px 0' }}>{c.method === 'cash' ? 'نقدي' : c.method === 'transfer' ? 'حوالة' : 'شيك'}</td>
                    <td style={{ padding: '10px 0' }}>{c.repName || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>لا توجد سندات قبض مسجلة</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <AuthGuard allowedRoles={['admin', 'accountant']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">مركز التقارير</h1>
          <p className="page-subtitle">تقارير مالية ومخزنية مفصلة لمتخذي القرار</p>
        </div>
        {user && ['admin', 'accountant'].includes(user.role) && (
          <button className="btn btn-secondary" onClick={handleBackup} disabled={backupLoading}>
            {backupLoading ? 'جاري التنزيل...' : 'تنزيل نسخة احتياطية من قاعدة البيانات'}
          </button>
        )}
      </div>

      <div className="tabs animate-slide" style={{ animationDelay: '0.1s' }}>
        <button 
          className={`tab ${reportType === 'financial' ? 'active' : ''}`}
          onClick={() => setReportType('financial')}
        >التقرير المالي (أرباح وخسائر)</button>
        <button 
          className={`tab ${reportType === 'inventory' ? 'active' : ''}`}
          onClick={() => setReportType('inventory')}
        >تقارير المخزون</button>
        <button 
          className={`tab ${reportType === 'debt' ? 'active' : ''}`}
          onClick={() => setReportType('debt')}
        >تقارير الديون والأرصدة</button>
        <button 
          className={`tab ${reportType === 'sales' ? 'active' : ''}`}
          onClick={() => setReportType('sales')}
        >تقارير المبيعات</button>
        <button 
          className={`tab ${reportType === 'purchases' ? 'active' : ''}`}
          onClick={() => setReportType('purchases')}
        >تقارير المشتريات</button>
        <button 
          className={`tab ${reportType === 'stocktake' ? 'active' : ''}`}
          onClick={() => setReportType('stocktake')}
        >تقارير الجرد</button>
        <button 
          className={`tab ${reportType === 'damaged' ? 'active' : ''}`}
          onClick={() => setReportType('damaged')}
        >المواد التالفة والمنتهية</button>
        <button 
          className={`tab ${reportType === 'collections' ? 'active' : ''}`}
          onClick={() => setReportType('collections')}
        >تقارير التحصيلات</button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <>
          {reportType === 'financial' && renderFinancialReport()}
          {reportType === 'inventory' && renderInventoryReport()}
          {reportType === 'debt' && renderDebtReport()}
          {reportType === 'sales' && renderSalesReport()}
          {reportType === 'purchases' && renderPurchasesReport()}
          {reportType === 'stocktake' && renderStocktakeReport()}
          {reportType === 'damaged' && renderDamagedReport()}
          {reportType === 'collections' && renderCollectionsReport()}
        </>
      )}
    </AuthGuard>
  );
}
