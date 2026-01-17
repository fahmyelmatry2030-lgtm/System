@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0">العملاء</h4>
    <a href="{{ route('clients.create') }}" class="btn btn-primary">إضافة عميل</a>
</div>

<form method="GET" action="{{ route('clients.index') }}" class="row g-2 mb-3">
    <div class="col-md-6">
        <input type="text" name="search" value="{{ request('search') }}" class="form-control" placeholder="بحث بالاسم/الموبايل/البريد/الرقم القومي">
    </div>
    <div class="col-md-3">
        <select name="client_type" class="form-select">
            <option value="">كل الأنواع</option>
            <option value="فرد" @selected(request('client_type')==='فرد')>فرد</option>
            <option value="شركة" @selected(request('client_type')==='شركة')>شركة</option>
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
                <th>الموبايل</th>
                <th>البريد</th>
                <th>النوع</th>
                <th class="text-nowrap">إجراءات</th>
            </tr>
        </thead>
        <tbody>
            @forelse($clients as $client)
                <tr>
                    <td>{{ $client->name }}</td>
                    <td>{{ $client->phone }}</td>
                    <td>{{ $client->email }}</td>
                    <td>{{ $client->client_type }}</td>
                    <td class="text-nowrap">
                        <a class="btn btn-sm btn-outline-primary" href="{{ route('clients.show', $client) }}">عرض</a>
                        <a class="btn btn-sm btn-outline-secondary" href="{{ route('clients.edit', $client) }}">تعديل</a>
                        <form method="POST" action="{{ route('clients.destroy', $client) }}" class="d-inline">
                            @csrf
                            @method('DELETE')
                            <button class="btn btn-sm btn-outline-danger" onclick="return confirm('تأكيد الحذف؟')">حذف</button>
                        </form>
                    </td>
                </tr>
            @empty
                <tr><td colspan="5" class="text-center">لا توجد بيانات</td></tr>
            @endforelse
        </tbody>
    </table>
</div>

{{ $clients->links() }}
@endsection
