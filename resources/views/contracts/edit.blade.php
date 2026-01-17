@extends('layouts.app')

@section('content')
<h4 class="mb-3">تعديل عقد</h4>

<form method="POST" action="{{ route('contracts.update', $contract) }}" class="row g-3">
    @csrf
    @method('PUT')

    <div class="col-md-6">
        <label class="form-label">العميل</label>
        <select name="client_id" class="form-select" required>
            @foreach($clients as $c)
                <option value="{{ $c->id }}" @selected((string)old('client_id', $contract->client_id)===(string)$c->id)>
                    {{ $c->name }} - {{ $c->phone }}
                </option>
            @endforeach
        </select>
    </div>

    <div class="col-md-6">
        <label class="form-label">الوحدة</label>
        <select name="unit_id" class="form-select" required>
            @foreach($units as $u)
                <option value="{{ $u->id }}" @selected((string)old('unit_id', $contract->unit_id)===(string)$u->id)>
                    {{ $u->unit_number }} - {{ $u->property?->name }} ({{ $u->status }})
                </option>
            @endforeach
        </select>
    </div>

    <div class="col-md-3">
        <label class="form-label">تاريخ البداية</label>
        <input type="date" name="start_date" value="{{ old('start_date', $contract->start_date) }}" class="form-control" required>
    </div>

    <div class="col-md-3">
        <label class="form-label">تاريخ النهاية</label>
        <input type="date" name="end_date" value="{{ old('end_date', $contract->end_date) }}" class="form-control" required>
    </div>

    <div class="col-md-3">
        <label class="form-label">الإيجار الشهري</label>
        <input type="number" step="0.01" name="monthly_rent" value="{{ old('monthly_rent', $contract->monthly_rent) }}" class="form-control" required>
    </div>

    <div class="col-md-3">
        <label class="form-label">التأمين</label>
        <input type="number" step="0.01" name="deposit_amount" value="{{ old('deposit_amount', $contract->deposit_amount) }}" class="form-control" required>
    </div>

    <div class="col-md-3">
        <label class="form-label">يوم التحصيل (1-28)</label>
        <input type="number" name="payment_day" min="1" max="28" value="{{ old('payment_day', $contract->payment_day) }}" class="form-control" required>
    </div>

    <div class="col-md-3">
        <label class="form-label">نوع العقد</label>
        <select name="contract_type" class="form-select" required>
            @foreach(['سكني','تجاري','إداري'] as $t)
                <option value="{{ $t }}" @selected(old('contract_type', $contract->contract_type)===$t)>{{ $t }}</option>
            @endforeach
        </select>
    </div>

    <div class="col-md-3">
        <label class="form-label">طريقة الدفع</label>
        <select name="payment_method" class="form-select" required>
            @foreach(['تحويل بنكي','شيك','نقدي'] as $m)
                <option value="{{ $m }}" @selected(old('payment_method', $contract->payment_method)===$m)>{{ $m }}</option>
            @endforeach
        </select>
    </div>

    <div class="col-md-3">
        <label class="form-label">حالة العقد</label>
        <select name="status" class="form-select" required>
            @foreach(['نشط','منتهي','ملغي'] as $s)
                <option value="{{ $s }}" @selected(old('status', $contract->status)===$s)>{{ $s }}</option>
            @endforeach
        </select>
    </div>

    <div class="col-md-12">
        <label class="form-label">سبب الإلغاء (لو الحالة ملغي)</label>
        <input type="text" name="cancellation_reason" value="{{ old('cancellation_reason', $contract->cancellation_reason) }}" class="form-control">
    </div>

    <div class="col-md-3">
        <label class="form-label">تاريخ الإلغاء</label>
        <input type="date" name="cancellation_date" value="{{ old('cancellation_date', $contract->cancellation_date) }}" class="form-control">
    </div>

    <div class="col-md-3">
        <label class="form-label">اسم الشاهد</label>
        <input type="text" name="witness_name" value="{{ old('witness_name', $contract->witness_name) }}" class="form-control">
    </div>

    <div class="col-md-3">
        <label class="form-label">هاتف الشاهد</label>
        <input type="text" name="witness_phone" value="{{ old('witness_phone', $contract->witness_phone) }}" class="form-control">
    </div>

    <div class="col-md-12">
        <label class="form-label">شروط (JSON اختياري)</label>
        <input type="text" name="terms" value="{{ old('terms', is_array($contract->terms) ? json_encode($contract->terms, JSON_UNESCAPED_UNICODE) : '') }}" class="form-control">
    </div>

    <div class="col-md-12">
        <label class="form-label">ملاحظات</label>
        <textarea name="notes" class="form-control" rows="3">{{ old('notes', $contract->notes) }}</textarea>
    </div>

    <div class="col-12">
        <button class="btn btn-primary" type="submit">تحديث</button>
        <a href="{{ route('contracts.show', $contract) }}" class="btn btn-secondary">رجوع</a>
    </div>
</form>
@endsection
