<!doctype html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Real Estate System') }}</title>
    <link rel="manifest" href="/manifest.webmanifest">
    <meta name="theme-color" content="#0b1220">
    <link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/icons/icon.svg">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">
        <a class="navbar-brand" href="{{ url('/') }}">{{ config('app.name', 'Real Estate System') }}</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            @auth
                <ul class="navbar-nav me-auto">
                    <li class="nav-item"><a class="nav-link" href="{{ route('dashboard') }}">لوحة التحكم</a></li>
                    <li class="nav-item"><a class="nav-link" href="{{ route('clients.index') }}">العملاء</a></li>
                    <li class="nav-item"><a class="nav-link" href="{{ route('properties.index') }}">العقارات</a></li>
                    <li class="nav-item"><a class="nav-link" href="{{ route('units.index') }}">الوحدات</a></li>
                    <li class="nav-item"><a class="nav-link" href="{{ route('contracts.index') }}">العقود</a></li>
                    <li class="nav-item"><a class="nav-link" href="{{ route('payments.index') }}">المدفوعات</a></li>
                </ul>

                <div class="d-flex align-items-center gap-2">
                    <span class="text-white-50">{{ auth()->user()->name }}</span>
                    <a class="btn btn-outline-light btn-sm" href="{{ route('profile.edit') }}">بيانات الحساب</a>
                    <a class="btn btn-outline-light btn-sm" href="{{ route('password.change') }}">تغيير كلمة المرور</a>
                    <form method="POST" action="{{ route('logout') }}" class="d-flex">
                    @csrf
                    <button class="btn btn-outline-light btn-sm" type="submit">تسجيل خروج</button>
                    </form>
                </div>
            @endauth
        </div>
    </div>
</nav>

<main class="container py-4">
    @if (session('success'))
        <div class="alert alert-success">{{ session('success') }}</div>
    @endif
    @if (session('error'))
        <div class="alert alert-danger">{{ session('error') }}</div>
    @endif

    @if ($errors->any())
        <div class="alert alert-danger">
            <ul class="mb-0">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    @yield('content')
</main>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js');
        });
    }
</script>
</body>
</html>
