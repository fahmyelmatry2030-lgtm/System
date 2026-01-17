@extends('layouts.app')

@section('content')
<h4 class="mb-3">إضافة عميل</h4>

<form method="POST" action="{{ route('clients.store') }}" class="row g-3">
    @csrf

    <div class="col-md-6">
        <label class="form-label">الاسم</label>
        <input type="text" name="name" value="{{ old('name') }}" class="form-control" required>
    </div>

    <div class="col-md-6">
        <label class="form-label">البريد الإلكتروني</label>
        <input type="email" name="email" value="{{ old('email') }}" class="form-control" required>
    </div>

    <div class="col-md-6">
        <label class="form-label">الموبايل</label>
        <input type="text" name="phone" value="{{ old('phone') }}" class="form-control" required>
    </div>

    <div class="col-md-6">
        <label class="form-label">الرقم القومي</label>
        <input type="text" name="national_id" value="{{ old('national_id') }}" class="form-control" required>
    </div>

    <div class="col-md-12">
        <label class="form-label">العنوان</label>
        <input type="text" name="address" value="{{ old('address') }}" class="form-control">
    </div>

    <div class="col-md-4">
        <label class="form-label">نوع العميل</label>
        <select name="client_type" class="form-select" required>
            <option value="فرد" @selected(old('client_type')==='فرد')>فرد</option>
            <option value="شركة" @selected(old('client_type')==='شركة')>شركة</option>
        </select>
    </div>

    <div class="col-md-12">
        <label class="form-label">ملاحظات</label>
        <textarea name="notes" class="form-control" rows="3">{{ old('notes') }}</textarea>
    </div>

    <div class="col-12">
        <button class="btn btn-primary" type="submit">حفظ</button>
        <a href="{{ route('clients.index') }}" class="btn btn-secondary">رجوع</a>
    </div>
</form>
@endsection
