@extends('layouts.app')

@section('content')
<div class="row justify-content-center">
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">تغيير كلمة المرور</div>
            <div class="card-body">
                <form method="POST" action="{{ route('password.change.perform') }}">
                    @csrf

                    <div class="mb-3">
                        <label class="form-label">كلمة المرور الحالية</label>
                        <input type="password" name="current_password" class="form-control" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">كلمة المرور الجديدة</label>
                        <input type="password" name="password" class="form-control" required>
                        <div class="form-text">يفضل ألا تقل عن 8 أحرف.</div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">تأكيد كلمة المرور الجديدة</label>
                        <input type="password" name="password_confirmation" class="form-control" required>
                    </div>

                    <div class="d-flex gap-2">
                        <button class="btn btn-primary" type="submit">حفظ</button>
                        <a class="btn btn-outline-secondary" href="{{ route('dashboard') }}">رجوع</a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
