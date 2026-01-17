@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0">العقود</h4>
    <a href="{{ route('contracts.create') }}" class="btn btn-primary">إنشاء عقد</a>
</div>

<form method="GET" action="{{ route('contracts.index') }}" class="row g-2 mb-3">
    <div class="col-md-6">
        <input type="text" name="search" value="{{ request('search') }}" class="form-control" placeholder="بحث برقم العقد/العميل/رقم الوحدة/اسم العقار">
    </div>
    <div class="col-md-3">
        <select name="status" class="form-select">
            <option value="">كل الحالات</option>
            @foreach(['نشط','منتهي','ملغي'] as $s)
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
            <th>رقم العقد</th>
            <th>العميل</th>
            <th>الوحدة</th>
            <th>الحالة</th>
            <th>من</th>
            <th>إلى</th>
            <th class="text-nowrap">إجراءات</th>
        </tr>
        </thead>
        <tbody>
        @forelse($contracts as $contract)
            <tr>
                <td>{{ $contract->contract_number }}</td>
                <td>{{ $contract->client?->name }}</td>
                <td>{{ $contract->unit?->unit_number }} - {{ $contract->unit?->property?->name }}</td>
                <td>{{ $contract->status }}</td>
                <td>{{ $contract->start_date }}</td>
                <td>{{ $contract->end_date }}</td>
                <td class="text-nowrap">
                    <a class="btn btn-sm btn-outline-primary" href="{{ route('contracts.show', $contract) }}">عرض</a>
                    <a class="btn btn-sm btn-outline-secondary" href="{{ route('contracts.edit', $contract) }}">تعديل</a>
                    <form method="POST" action="{{ route('contracts.destroy', $contract) }}" class="d-inline">
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

{{ $contracts->links() }}
@endsection
