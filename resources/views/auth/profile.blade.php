@extends('layouts.app')

@section('content')
<div class="row justify-content-center">
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">بيانات الحساب</div>
            <div class="card-body">
                <form method="POST" action="{{ route('profile.update') }}">
                    @csrf

                    <div class="mb-3">
                        <label class="form-label">اسم المستخدم</label>
                        <input type="text" name="name" value="{{ old('name', $user->name) }}" class="form-control" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">البريد الإلكتروني</label>
                        <input type="email" name="email" value="{{ old('email', $user->email) }}" class="form-control" required>
                    </div>

                    <div class="d-flex gap-2">
                        <button class="btn btn-primary" type="submit">حفظ</button>
                        <a class="btn btn-outline-secondary" href="{{ route('dashboard') }}">رجوع</a>
                    </div>
                </form>

                <hr>

                <div class="text-muted" style="font-size: 0.9rem;">
                    ملاحظة: البريد الإلكتروني هو المستخدم في تسجيل الدخول.
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
