@extends('layouts.app')

@section('content')
<h4 class="mb-3">لوحة التحكم</h4>

<div class="row g-3 mb-4">
    <div class="col-md-3">
        <div class="card"><div class="card-body">
            <div class="text-muted">العملاء</div>
            <div class="fs-4">{{ $stats['clients'] }}</div>
        </div></div>
    </div>
    <div class="col-md-3">
        <div class="card"><div class="card-body">
            <div class="text-muted">العقارات</div>
            <div class="fs-4">{{ $stats['properties'] }}</div>
        </div></div>
    </div>
    <div class="col-md-3">
        <div class="card"><div class="card-body">
            <div class="text-muted">الوحدات</div>
            <div class="fs-4">{{ $stats['units'] }}</div>
        </div></div>
    </div>
    <div class="col-md-3">
        <div class="card"><div class="card-body">
            <div class="text-muted">عقود نشطة</div>
            <div class="fs-4">{{ $stats['contracts_active'] }}</div>
        </div></div>
    </div>

    <div class="col-md-3">
        <div class="card"><div class="card-body">
            <div class="text-muted">وحدات متاحة</div>
            <div class="fs-4">{{ $stats['units_available'] }}</div>
        </div></div>
    </div>
    <div class="col-md-3">
        <div class="card"><div class="card-body">
            <div class="text-muted">وحدات مؤجرة</div>
            <div class="fs-4">{{ $stats['units_rented'] }}</div>
        </div></div>
    </div>
    <div class="col-md-3">
        <div class="card"><div class="card-body">
            <div class="text-muted">مدفوعات الشهر</div>
            <div class="fs-4">{{ $stats['payments_month'] }}</div>
        </div></div>
    </div>
    <div class="col-md-3">
        <div class="card"><div class="card-body">
            <div class="text-muted">مدفوعات متأخرة</div>
            <div class="fs-4">{{ $stats['payments_late'] }}</div>
        </div></div>
    </div>
</div>

<div class="card">
    <div class="card-header">آخر المدفوعات</div>
    <div class="card-body table-responsive">
        <table class="table table-bordered mb-0">
            <thead>
            <tr>
                <th>رقم الدفعة</th>
                <th>العميل</th>
                <th>رقم العقد</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>الحالة</th>
            </tr>
            </thead>
            <tbody>
            @forelse($latestPayments as $p)
                <tr>
                    <td><a href="{{ route('payments.show', $p) }}">{{ $p->payment_number }}</a></td>
                    <td>{{ $p->client?->name }}</td>
                    <td>{{ $p->contract?->contract_number }}</td>
                    <td>{{ $p->payment_date }}</td>
                    <td>{{ $p->amount }}</td>
                    <td>{{ $p->status }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="text-center">لا توجد بيانات</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection
