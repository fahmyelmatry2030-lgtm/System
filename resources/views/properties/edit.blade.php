@extends('layouts.app')

@section('content')
<h4 class="mb-3">تعديل عقار</h4>

<form method="POST" action="{{ route('properties.update', $property) }}" class="row g-3">
    @csrf
    @method('PUT')

    <div class="col-md-6">
        <label class="form-label">الاسم</label>
        <input type="text" name="name" value="{{ old('name', $property->name) }}" class="form-control" required>
    </div>

    <div class="col-md-6">
        <label class="form-label">نوع العقار</label>
        <select name="type" class="form-select" required>
            @foreach(['شقة','فيلا','عمارة','محل تجاري','أرض'] as $t)
                <option value="{{ $t }}" @selected(old('type', $property->type)===$t)>{{ $t }}</option>
            @endforeach
        </select>
    </div>

    <div class="col-md-12">
        <label class="form-label">العنوان</label>
        <input type="text" name="address" value="{{ old('address', $property->address) }}" class="form-control" required>
    </div>

    <div class="col-md-6">
        <label class="form-label">المدينة</label>
        <input type="text" name="city" value="{{ old('city', $property->city) }}" class="form-control" required>
    </div>

    <div class="col-md-6">
        <label class="form-label">الحي</label>
        <input type="text" name="district" value="{{ old('district', $property->district) }}" class="form-control" required>
    </div>

    <div class="col-md-3">
        <label class="form-label">عدد الأدوار</label>
        <input type="number" name="floors_count" value="{{ old('floors_count', $property->floors_count) }}" class="form-control" min="1" required>
    </div>

    <div class="col-md-3">
        <label class="form-label">عدد الوحدات</label>
        <input type="number" name="units_count" value="{{ old('units_count', $property->units_count) }}" class="form-control" min="1" required>
    </div>

    <div class="col-md-3 d-flex align-items-end">
        <input type="hidden" name="has_elevator" value="0">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" name="has_elevator" id="has_elevator" value="1" @checked(old('has_elevator', (bool) $property->has_elevator))>
            <label class="form-check-label" for="has_elevator">مصعد</label>
        </div>
    </div>

    <div class="col-md-3 d-flex align-items-end">
        <input type="hidden" name="has_parking" value="0">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" name="has_parking" id="has_parking" value="1" @checked(old('has_parking', (bool) $property->has_parking))>
            <label class="form-check-label" for="has_parking">مواقف</label>
        </div>
    </div>

    <div class="col-md-3 d-flex align-items-end">
        <input type="hidden" name="is_active" value="0">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" name="is_active" id="is_active" value="1" @checked(old('is_active', (bool) $property->is_active))>
            <label class="form-check-label" for="is_active">نشط</label>
        </div>
    </div>

    <div class="col-md-12">
        <label class="form-label">وصف</label>
        <textarea name="description" class="form-control" rows="3">{{ old('description', $property->description) }}</textarea>
    </div>

    <div class="col-12">
        <button class="btn btn-primary" type="submit">تحديث</button>
        <a href="{{ route('properties.show', $property) }}" class="btn btn-secondary">رجوع</a>
    </div>
</form>
@endsection
