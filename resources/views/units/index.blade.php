@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0">الوحدات</h4>
    <a href="{{ route('units.create') }}" class="btn btn-primary">إضافة وحدة</a>
</div>

<form method="GET" action="{{ route('units.index') }}" class="row g-2 mb-3">
    <div class="col-md-5">
        <input type="text" name="search" value="{{ request('search') }}" class="form-control" placeholder="بحث برقم الوحدة/اسم العقار/العنوان">
    </div>
    <div class="col-md-3">
        <select name="status" class="form-select">
            <option value="">كل الحالات</option>
            @foreach(['متاح','مؤجر','محجوز','صيانة'] as $s)
                <option value="{{ $s }}" @selected(request('status')===$s)>{{ $s }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-3">
        <select name="property_id" class="form-select">
            <option value="">كل العقارات</option>
            @foreach($properties as $p)
                <option value="{{ $p->id }}" @selected((string)request('property_id')===(string)$p->id)>{{ $p->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-1">
        <button class="btn btn-secondary w-100" type="submit">بحث</button>
    </div>
</form>

<div class="table-responsive">
    <table class="table table-bordered table-striped align-middle">
        <thead>
        <tr>
            <th>العقار</th>
            <th>رقم الوحدة</th>
            <th>الدور</th>
            <th>الحالة</th>
            <th>الإيجار</th>
            <th class="text-nowrap">إجراءات</th>
        </tr>
        </thead>
        <tbody>
        @forelse($units as $unit)
            <tr>
                <td>{{ $unit->property?->name }}</td>
                <td>{{ $unit->unit_number }}</td>
                <td>{{ $unit->floor_number }}</td>
                <td>{{ $unit->status }}</td>
                <td>{{ $unit->monthly_rent }}</td>
                <td class="text-nowrap">
                    <a class="btn btn-sm btn-outline-primary" href="{{ route('units.show', $unit) }}">عرض</a>
                    <a class="btn btn-sm btn-outline-secondary" href="{{ route('units.edit', $unit) }}">تعديل</a>
                    <form method="POST" action="{{ route('units.destroy', $unit) }}" class="d-inline">
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

{{ $units->links() }}
@endsection
