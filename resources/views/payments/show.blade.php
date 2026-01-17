@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0">تفاصيل الدفعة</h4>
    <div class="d-flex gap-2">
        <a href="{{ route('payments.edit', $payment) }}" class="btn btn-secondary">تعديل</a>
        <a href="{{ route('payments.index') }}" class="btn btn-outline-secondary">رجوع</a>
    </div>
</div>

<div class="card mb-3">
    <div class="card-body">
        <div class="row">
            <div class="col-md-6"><strong>رقم الدفعة:</strong> {{ $payment->payment_number }}</div>
            <div class="col-md-6"><strong>الحالة:</strong> {{ $payment->status }}</div>
            <div class="col-md-6"><strong>العميل:</strong> {{ $payment->client?->name }}</div>
            <div class="col-md-6"><strong>رقم العقد:</strong> {{ $payment->contract?->contract_number }}</div>
            <div class="col-md-6"><strong>التاريخ:</strong> {{ $payment->payment_date }}</div>
            <div class="col-md-6"><strong>المبلغ:</strong> {{ $payment->amount }}</div>
            <div class="col-md-6"><strong>المتبقي:</strong> {{ $payment->remaining_amount }}</div>
            <div class="col-md-6"><strong>طريقة الدفع:</strong> {{ $payment->payment_method }}</div>
            <div class="col-md-6"><strong>رسوم تأخير:</strong> {{ $payment->late_fee }}</div>
            <div class="col-md-6"><strong>خصم:</strong> {{ $payment->discount }}</div>
            <div class="col-md-12"><strong>سبب الخصم:</strong> {{ $payment->discount_reason }}</div>
            <div class="col-md-12"><strong>ملاحظات:</strong> {{ $payment->notes }}</div>
            <div class="col-md-6"><strong>تم الاستلام بواسطة:</strong> {{ $payment->received_by }}</div>
        </div>

        @if($payment->attachment)
            <hr>
            <div>
                <strong>مرفق:</strong>
                <a href="{{ asset('storage/'.$payment->attachment) }}" target="_blank">تحميل / عرض</a>
            </div>
        @endif
    </div>
</div>

<form method="POST" action="{{ route('payments.markLate', $payment) }}">
    @csrf
    <button class="btn btn-outline-warning" onclick="return confirm('تأكيد تحويل الدفعة إلى متأخر؟')">تحديد كـ متأخر</button>
</form>
@endsection
