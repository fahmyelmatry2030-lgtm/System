@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0">المدفوعات</h4>
    <a href="{{ route('payments.create') }}" class="btn btn-primary">إضافة دفعة</a>
</div>

<form method="GET" action="{{ route('payments.index') }}" class="row g-2 mb-3">
    <div class="col-md-6">
        <input type="text" name="search" value="{{ request('search') }}" class="form-control" placeholder="بحث برقم الدفعة/رقم العقد/اسم العميل/الموبايل/الرقم القومي">
    </div>
    <div class="col-md-3">
        <select name="status" class="form-select">
            <option value="">كل الحالات</option>
            @foreach(['مدفوع','مدفوع جزئياً','متأخر','ملغي'] as $s)
                <option value="{{ $s }}" @selected(request('status')===$s)>{{ $s }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-3">
        <button class="btn btn-secondary w-100" type="submit">بحث</button>
    </div>
</form>

<div class="table-responsive">
    <table class="table table-bordered table-striped align-middle">
        <thead>
        <tr>
            <th>رقم الدفعة</th>
            <th>العميل</th>
            <th>رقم العقد</th>
            <th>التاريخ</th>
            <th>المبلغ</th>
            <th>الحالة</th>
            <th class="text-nowrap">إجراءات</th>
        </tr>
        </thead>
        <tbody>
        @forelse($payments as $payment)
            <tr>
                <td>{{ $payment->payment_number }}</td>
                <td>{{ $payment->client?->name }}</td>
                <td>{{ $payment->contract?->contract_number }}</td>
                <td>{{ $payment->payment_date }}</td>
                <td>{{ $payment->amount }}</td>
                <td>{{ $payment->status }}</td>
                <td class="text-nowrap">
                    <a class="btn btn-sm btn-outline-primary" href="{{ route('payments.show', $payment) }}">عرض</a>
                    <a class="btn btn-sm btn-outline-secondary" href="{{ route('payments.edit', $payment) }}">تعديل</a>
                    <form method="POST" action="{{ route('payments.destroy', $payment) }}" class="d-inline">
                        @csrf
                        @method('DELETE')
                        <button class="btn btn-sm btn-outline-danger" onclick="return confirm('تأكيد الحذف؟')">حذف</button>
                    </form>
                </td>
            </tr>
        @empty
            <tr><td colspan="7" class="text-center">لا توجد بيانات</td></tr>
        @endforelse
        </tbody>
    </table>
</div>

{{ $payments->links() }}
@endsection
