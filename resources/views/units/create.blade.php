@extends('layouts.app')

@section('content')
<h4 class="mb-3">إضافة وحدة</h4>

<form method="POST" action="{{ route('units.store') }}" class="row g-3">
    @csrf

    <div class="col-md-6">
        <label class="form-label">العقار</label>
        <select name="property_id" class="form-select" required>
            @foreach($properties as $p)
                <option value="{{ $p->id }}" @selected((string)old('property_id')===(string)$p->id)>{{ $p->name }}</option>
            @endforeach
        </select>
    </div>

    <div class="col-md-6">
        <label class="form-label">رقم الوحدة</label>
        <input type="text" name="unit_number" value="{{ old('unit_number') }}" class="form-control" required>
    </div>

    <div class="col-md-3">
        <label class="form-label">الدور</label>
        <input type="number" name="floor_number" value="{{ old('floor_number', 0) }}" class="form-control" required>
    </div>

    <div class="col-md-3">
        <label class="form-label">الغرف</label>
        <input type="number" name="rooms_count" value="{{ old('rooms_count', 1) }}" class="form-control" min="0" required>
    </div>

    <div class="col-md-3">
        <label class="form-label">الحمامات</label>
        <input type="number" name="bathrooms_count" value="{{ old('bathrooms_count', 1) }}" class="form-control" min="0" required>
    </div>

    <div class="col-md-3">
        <label class="form-label">المساحة</label>
        <input type="number" step="0.01" name="area" value="{{ old('area') }}" class="form-control" required>
    </div>

    <div class="col-md-4">
        <label class="form-label">الإيجار الشهري</label>
        <input type="number" step="0.01" name="monthly_rent" value="{{ old('monthly_rent') }}" class="form-control" required>
    </div>

    <div class="col-md-4">
        <label class="form-label">مبلغ التأمين</label>
        <input type="number" step="0.01" name="deposit_amount" value="{{ old('deposit_amount', 0) }}" class="form-control">
    </div>

    <div class="col-md-4">
        <label class="form-label">الحالة</label>
        <select name="status" class="form-select" required>
            @foreach($statuses as $k => $v)
                <option value="{{ $k }}" @selected(old('status')===$k)>{{ $v }}</option>
            @endforeach
        </select>
    </div>

    <div class="col-md-4 d-flex align-items-end">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" name="is_furnished" id="is_furnished" @checked(old('is_furnished'))>
            <label class="form-check-label" for="is_furnished">مفروشة</label>
        </div>
    </div>

    <div class="col-md-4 d-flex align-items-end">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" name="has_kitchen" id="has_kitchen" @checked(old('has_kitchen', true))>
            <label class="form-check-label" for="has_kitchen">مطبخ</label>
        </div>
    </div>

    <div class="col-md-4 d-flex align-items-end">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" name="has_balcony" id="has_balcony" @checked(old('has_balcony'))>
            <label class="form-check-label" for="has_balcony">بلكونة</label>
        </div>
    </div>

    <div class="col-md-12">
        <label class="form-label">مميزات (JSON اختياري)</label>
        <input type="text" name="features" value="{{ old('features') }}" class="form-control" placeholder='مثال: ["تكييف","غاز"]'>
    </div>

    <div class="col-md-12">
        <label class="form-label">وصف</label>
        <textarea name="description" class="form-control" rows="3">{{ old('description') }}</textarea>
    </div>

    <div class="col-12">
        <button class="btn btn-primary" type="submit">حفظ</button>
        <a href="{{ route('units.index') }}" class="btn btn-secondary">رجوع</a>
    </div>
</form>
@endsection
