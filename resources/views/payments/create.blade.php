@extends('layouts.app')

@section('content')
<h4 class="mb-3">إضافة دفعة</h4>

<form method="POST" action="{{ route('payments.store') }}" class="row g-3" enctype="multipart/form-data">
    @csrf

    <div class="col-md-6">
        <label class="form-label">العقد</label>
        <select name="contract_id" class="form-select" required>
            @foreach($contracts as $c)
                <option value="{{ $c->id }}" @selected((string)old('contract_id', $selectedContractId ?? '')===(string)$c->id)>
                    {{ $c->contract_number }} - {{ $c->client?->name }} - {{ $c->unit?->unit_number }}
                </option>
            @endforeach
        </select>
    </div>

    <div class="col-md-6">
        <label class="form-label">العميل (يجب أن يطابق عميل العقد)</label>
        <select name="client_id" class="form-select" required>
            @foreach($clients as $cl)
                <option value="{{ $cl->id }}" @selected((string)old('client_id', $selectedClientId ?? '')===(string)$cl->id)>
                    {{ $cl->name }} - {{ $cl->phone }}
                </option>
            @endforeach
        </select>
    </div>

    <div class="col-md-3">
        <label class="form-label">تاريخ الدفع</label>
        <input type="date" name="payment_date" value="{{ old('payment_date') }}" class="form-control" required>
    </div>

    <div class="col-md-3">
        <label class="form-label">المبلغ</label>
        <input type="number" step="0.01" name="amount" value="{{ old('amount') }}" class="form-control" required>
    </div>

    <div class="col-md-3">
        <label class="form-label">المتبقي</label>
        <input type="number" step="0.01" name="remaining_amount" value="{{ old('remaining_amount', 0) }}" class="form-control">
    </div>

    <div class="col-md-3">
        <label class="form-label">طريقة الدفع</label>
        <select name="payment_method" class="form-select" required>
            @foreach(['نقدي','تحويل بنكي','شيك','حوالة'] as $m)
                <option value="{{ $m }}" @selected(old('payment_method')===$m)>{{ $m }}</option>
            @endforeach
        </select>
    </div>

    <div class="col-md-4">
        <label class="form-label">اسم البنك</label>
        <input type="text" name="bank_name" value="{{ old('bank_name') }}" class="form-control">
    </div>

    <div class="col-md-4">
        <label class="form-label">رقم الشيك</label>
        <input type="text" name="check_number" value="{{ old('check_number') }}" class="form-control">
    </div>

    <div class="col-md-4">
        <label class="form-label">تاريخ الشيك</label>
        <input type="date" name="check_date" value="{{ old('check_date') }}" class="form-control">
    </div>

    <div class="col-md-4">
        <label class="form-label">رقم العملية/التحويل</label>
        <input type="text" name="transaction_number" value="{{ old('transaction_number') }}" class="form-control">
    </div>

    <div class="col-md-4">
        <label class="form-label">من (الفترة)</label>
        <input type="date" name="start_date" value="{{ old('start_date') }}" class="form-control" required>
    </div>

    <div class="col-md-4">
        <label class="form-label">إلى (الفترة)</label>
        <input type="date" name="end_date" value="{{ old('end_date') }}" class="form-control" required>
    </div>

    <div class="col-md-4">
        <label class="form-label">الحالة</label>
        <select name="status" class="form-select" required>
            @foreach(['مدفوع','مدفوع جزئياً','متأخر','ملغي'] as $s)
                <option value="{{ $s }}" @selected(old('status', 'مدفوع')===$s)>{{ $s }}</option>
            @endforeach
        </select>
    </div>

    <div class="col-md-4">
        <label class="form-label">رسوم تأخير</label>
        <input type="number" step="0.01" name="late_fee" value="{{ old('late_fee', 0) }}" class="form-control">
    </div>

    <div class="col-md-4">
        <label class="form-label">خصم</label>
        <input type="number" step="0.01" name="discount" value="{{ old('discount', 0) }}" class="form-control">
    </div>

    <div class="col-md-4">
        <label class="form-label">سبب الخصم</label>
        <input type="text" name="discount_reason" value="{{ old('discount_reason') }}" class="form-control">
    </div>

    <div class="col-md-12">
        <label class="form-label">ملاحظات</label>
        <textarea name="notes" class="form-control" rows="3">{{ old('notes') }}</textarea>
    </div>

    <div class="col-md-6">
        <label class="form-label">تم الاستلام بواسطة</label>
        <input type="text" name="received_by" value="{{ old('received_by', 'المستخدم') }}" class="form-control" required>
    </div>

    <div class="col-md-6">
        <label class="form-label">مرفق (اختياري)</label>
        <input type="file" name="attachment" class="form-control">
    </div>

    <div class="col-12">
        <button class="btn btn-primary" type="submit">حفظ</button>
        <a href="{{ route('payments.index') }}" class="btn btn-secondary">رجوع</a>
    </div>
</form>
@endsection
