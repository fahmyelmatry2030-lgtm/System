@extends('layouts.app')

@section('content')
<div class="row justify-content-center">
    <div class="col-md-5">
        <div class="card">
            <div class="card-header">تسجيل الدخول</div>
            <div class="card-body">
                <form method="POST" action="{{ route('login.perform') }}">
                    @csrf

                    <div class="mb-3">
                        <label class="form-label">البريد الإلكتروني</label>
                        <input type="email" name="email" value="{{ old('email') }}" class="form-control" required autofocus>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">كلمة المرور</label>
                        <input type="password" name="password" class="form-control" required>
                    </div>

                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" name="remember" id="remember" value="1">
                        <label class="form-check-label" for="remember">تذكرني</label>
                    </div>

                    <button class="btn btn-primary w-100" type="submit">دخول</button>

                    <div class="text-muted mt-3" style="font-size: 0.9rem;">
                        بيانات افتراضية (Seeder):
                        <div>email: test@example.com</div>
                        <div>password: password</div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
