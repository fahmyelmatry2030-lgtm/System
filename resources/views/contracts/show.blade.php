@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0">تفاصيل العقد</h4>
    <div class="d-flex gap-2">
        <a href="{{ route('contracts.edit', $contract) }}" class="btn btn-secondary">تعديل</a>
        <a href="{{ route('contracts.index') }}" class="btn btn-outline-secondary">رجوع</a>
    </div>
</div>

<div class="card mb-3">
    <div class="card-body">
        <div class="row">
            <div class="col-md-6"><strong>رقم العقد:</strong> {{ $contract->contract_number }}</div>
            <div class="col-md-6"><strong>الحالة:</strong> {{ $contract->status }}</div>
            <div class="col-md-6"><strong>العميل:</strong> {{ $contract->client?->name }}</div>
            <div class="col-md-6"><strong>الوحدة:</strong> {{ $contract->unit?->unit_number }} - {{ $contract->unit?->property?->name }}</div>
            <div class="col-md-6"><strong>من:</strong> {{ $contract->start_date }}</div>
            <div class="col-md-6"><strong>إلى:</strong> {{ $contract->end_date }}</div>
            <div class="col-md-6"><strong>الإيجار:</strong> {{ $contract->monthly_rent }}</div>
            <div class="col-md-6"><strong>التأمين:</strong> {{ $contract->deposit_amount }}</div>
            <div class="col-md-12"><strong>ملاحظات:</strong> {{ $contract->notes }}</div>
        </div>
    </div>
</div>

<div class="d-flex gap-2 mb-3">
    <form method="POST" action="{{ route('contracts.cancel', $contract) }}">
        @csrf
        <input type="hidden" name="cancellation_reason" value="إلغاء من صفحة التفاصيل">
        <button class="btn btn-outline-danger" onclick="return confirm('تأكيد إلغاء العقد؟')">إلغاء العقد</button>
    </form>
    <form method="POST" action="{{ route('contracts.finish', $contract) }}">
        @csrf
        <button class="btn btn-outline-warning" onclick="return confirm('تأكيد إنهاء العقد؟')">إنهاء العقد</button>
    </form>
    <a href="{{ route('payments.create', ['contract_id' => $contract->id]) }}" class="btn btn-outline-primary">إضافة دفعة</a>
</div>

@if($contract->payments && $contract->payments->count())
<div class="card">
    <div class="card-header">المدفوعات</div>
    <div class="card-body table-responsive">
        <table class="table table-bordered mb-0">
            <thead>
            <tr>
                <th>رقم الدفعة</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>الحالة</th>
            </tr>
            </thead>
            <tbody>
            @foreach($contract->payments as $p)
                <tr>
                    <td><a href="{{ route('payments.show', $p) }}">{{ $p->payment_number }}</a></td>
                    <td>{{ $p->payment_date }}</td>
                    <td>{{ $p->amount }}</td>
                    <td>{{ $p->status }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
</div>
@endif
@endsection
