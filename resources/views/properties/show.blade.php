@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0">تفاصيل العقار</h4>
    <div class="d-flex gap-2">
        <a href="{{ route('properties.edit', $property) }}" class="btn btn-secondary">تعديل</a>
        <a href="{{ route('properties.index') }}" class="btn btn-outline-secondary">رجوع</a>
    </div>
</div>

<div class="card mb-3">
    <div class="card-body">
        <div class="row">
            <div class="col-md-6"><strong>الاسم:</strong> {{ $property->name }}</div>
            <div class="col-md-6"><strong>النوع:</strong> {{ $property->type }}</div>
            <div class="col-md-6"><strong>المدينة:</strong> {{ $property->city }}</div>
            <div class="col-md-6"><strong>الحي:</strong> {{ $property->district }}</div>
            <div class="col-md-12"><strong>العنوان:</strong> {{ $property->address }}</div>
            <div class="col-md-4"><strong>عدد الأدوار:</strong> {{ $property->floors_count }}</div>
            <div class="col-md-4"><strong>عدد الوحدات:</strong> {{ $property->units_count }}</div>
            <div class="col-md-4"><strong>نشط:</strong> {{ $property->is_active ? 'نعم' : 'لا' }}</div>
            <div class="col-md-12"><strong>وصف:</strong> {{ $property->description }}</div>
        </div>
    </div>
</div>

@if(isset($property->units) && $property->units->count())
    <div class="card">
        <div class="card-header">الوحدات</div>
        <div class="card-body table-responsive">
            <table class="table table-bordered mb-0">
                <thead>
                <tr>
                    <th>رقم الوحدة</th>
                    <th>الحالة</th>
                    <th>الإيجار الشهري</th>
                </tr>
                </thead>
                <tbody>
                @foreach($property->units as $unit)
                    <tr>
                        <td>{{ $unit->unit_number }}</td>
                        <td>{{ $unit->status }}</td>
                        <td>{{ $unit->monthly_rent }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    </div>
@endif
@endsection
