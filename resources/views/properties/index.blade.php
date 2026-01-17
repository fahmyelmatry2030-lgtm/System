@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0">العقارات</h4>
    <a href="{{ route('properties.create') }}" class="btn btn-primary">إضافة عقار</a>
</div>

<form method="GET" action="{{ route('properties.index') }}" class="row g-2 mb-3">
    <div class="col-md-6">
        <input type="text" name="search" value="{{ request('search') }}" class="form-control" placeholder="بحث بالاسم/العنوان/المدينة/الحي">
    </div>
    <div class="col-md-3">
        <select name="type" class="form-select">
            <option value="">كل الأنواع</option>
            @foreach(['شقة','فيلا','عمارة','محل تجاري','أرض'] as $t)
                <option value="{{ $t }}" @selected(request('type')===$t)>{{ $t }}</option>
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
            <th>الاسم</th>
            <th>النوع</th>
            <th>المدينة</th>
            <th>الحي</th>
            <th>الوحدات</th>
            <th class="text-nowrap">إجراءات</th>
        </tr>
        </thead>
        <tbody>
        @forelse($properties as $property)
            <tr>
                <td>{{ $property->name }}</td>
                <td>{{ $property->type }}</td>
                <td>{{ $property->city }}</td>
                <td>{{ $property->district }}</td>
                <td>{{ $property->units_count }}</td>
                <td class="text-nowrap">
                    <a class="btn btn-sm btn-outline-primary" href="{{ route('properties.show', $property) }}">عرض</a>
                    <a class="btn btn-sm btn-outline-secondary" href="{{ route('properties.edit', $property) }}">تعديل</a>
                    <form method="POST" action="{{ route('properties.destroy', $property) }}" class="d-inline">
                        @csrf
                        @method('DELETE')
                        <button class="btn btn-sm btn-outline-danger" onclick="return confirm('تأكيد الحذف؟')">حذف</button>
                    </form>
                </td>
            </tr>
        @empty
            <tr><td colspan="6" class="text-center">لا توجد بيانات</td></tr>
        @endforelse
        </tbody>
    </table>
</div>

{{ $properties->links() }}
@endsection
