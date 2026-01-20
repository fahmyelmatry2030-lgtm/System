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
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet">

    @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @else
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    @endif
</head>
<body class="bg-gray-50 text-gray-900 font-sans antialiased">
    <div class="min-h-screen flex overflow-hidden bg-gray-50">
        <!-- Sidebar for Desktop -->
        <aside class="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:right-0 md:border-l md:border-gray-200 md:bg-white md:z-50 shadow-sm">
            <div class="flex items-center justify-center h-16 border-b border-gray-100 bg-white">
                <a href="{{ url('/') }}" class="font-heading font-bold text-xl text-primary-700 flex items-center gap-2">
                    <span class="p-1.5 bg-primary-100 rounded-lg text-primary-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </span>
                    {{ config('app.name', 'Real Estate') }}
                </a>
            </div>
            <div class="flex flex-col flex-grow overflow-y-auto">
                <nav class="flex-1 px-4 py-6 space-y-2">
                     @auth
                        <a href="{{ route('dashboard') }}" class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors {{ request()->routeIs('dashboard') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900' }}">
                            <svg class="ml-3 h-5 w-5 {{ request()->routeIs('dashboard') ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500' }}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            لوحة التحكم
                        </a>
                        <a href="{{ route('clients.index') }}" class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors {{ request()->routeIs('clients.*') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900' }}">
                            <svg class="ml-3 h-5 w-5 {{ request()->routeIs('clients.*') ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500' }}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            العملاء
                        </a>
                        <a href="{{ route('properties.index') }}" class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors {{ request()->routeIs('properties.*') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900' }}">
                            <svg class="ml-3 h-5 w-5 {{ request()->routeIs('properties.*') ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500' }}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            العقارات
                        </a>
                        <a href="{{ route('units.index') }}" class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors {{ request()->routeIs('units.*') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900' }}">
                             <svg class="ml-3 h-5 w-5 {{ request()->routeIs('units.*') ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500' }}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                            الوحدات
                        </a>
                        <a href="{{ route('contracts.index') }}" class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors {{ request()->routeIs('contracts.*') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900' }}">
                             <svg class="ml-3 h-5 w-5 {{ request()->routeIs('contracts.*') ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500' }}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            العقود
                        </a>
                        <a href="{{ route('payments.index') }}" class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors {{ request()->routeIs('payments.*') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900' }}">
                             <svg class="ml-3 h-5 w-5 {{ request()->routeIs('payments.*') ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500' }}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            المدفوعات
                        </a>
                     @endauth
                </nav>
                @auth
                <div class="p-4 border-t border-gray-200">
                    <div class="flex items-center gap-3">
                        <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                            {{ substr(auth()->user()->name, 0, 1) }}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 truncate">
                                {{ auth()->user()->name }}
                            </p>
                            <p class="text-xs text-gray-500 truncate">
                                {{ auth()->user()->heading ?? 'مدير النظام' }}
                            </p>
                        </div>
                    </div>
                     <div class="mt-4 flex gap-2">
                        <a href="{{ route('profile.edit') }}" class="flex-1 text-center py-1.5 px-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50">
                            الملف الشخصي
                        </a>
                        <form method="POST" action="{{ route('logout') }}" class="flex-1">
                            @csrf
                            <button type="submit" class="w-full text-center py-1.5 px-3 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700">
                                خروج
                            </button>
                        </form>
                    </div>
                    <!-- PWA Install Button -->
                    <button id="install-btn" class="hidden w-full mt-3 flex items-center justify-center gap-2 py-1.5 px-3 border border-primary-200 rounded-md shadow-sm text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        تثبيت التطبيق
                    </button>
                </div>
                @endauth
            </div>
        </aside>

        <!-- Main Content Wrapper -->
        <div class="flex-1 flex flex-col md:mr-64 min-h-screen transition-all duration-300">
            <!-- Mobile Header -->
            <div class="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2 sticky top-0 z-40 h-16">
                 <a href="{{ url('/') }}" class="font-heading font-bold text-lg text-primary-700 flex items-center gap-2">
                    <span class="p-1 bg-primary-100 rounded text-primary-600">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </span>
                    Real Estate
                </a>
                <div class="flex items-center gap-2">
                    <button id="mobile-install-btn" class="hidden p-2 text-primary-600 hover:bg-primary-50 rounded-md">
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                    <button type="button" class="-mr-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500" aria-controls="mobile-menu" aria-expanded="false" id="mobile-menu-btn">
                         <span class="sr-only">Open menu</span>
                         <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Mobile Menu Dropdown (Hidden by default) -->
            <div class="md:hidden hidden bg-white border-b border-gray-200" id="mobile-menu">
                <nav class="px-2 pt-2 pb-3 space-y-1">
                      @auth
                        <a href="{{ route('dashboard') }}" class="block px-3 py-2 rounded-md text-base font-medium {{ request()->routeIs('dashboard') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50' }}">لوحة التحكم</a>
                        <a href="{{ route('clients.index') }}" class="block px-3 py-2 rounded-md text-base font-medium {{ request()->routeIs('clients.*') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50' }}">العملاء</a>
                        <a href="{{ route('properties.index') }}" class="block px-3 py-2 rounded-md text-base font-medium {{ request()->routeIs('properties.*') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50' }}">العقارات</a>
                        <a href="{{ route('units.index') }}" class="block px-3 py-2 rounded-md text-base font-medium {{ request()->routeIs('units.*') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50' }}">الوحدات</a>
                        <a href="{{ route('contracts.index') }}" class="block px-3 py-2 rounded-md text-base font-medium {{ request()->routeIs('contracts.*') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50' }}">العقود</a>
                        <a href="{{ route('payments.index') }}" class="block px-3 py-2 rounded-md text-base font-medium {{ request()->routeIs('payments.*') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50' }}">المدفوعات</a>
                        
                        <div class="border-t border-gray-200 mt-4 pt-4">
                             <div class="flex items-center px-3 mb-3">
                                <div class="flex-shrink-0">
                                    <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                        {{ substr(auth()->user()->name, 0, 1) }}
                                    </div>
                                </div>
                                <div class="mr-3">
                                    <div class="text-base font-medium text-gray-800">{{ auth()->user()->name }}</div>
                                    <div class="text-sm font-medium text-gray-500">{{ auth()->user()->email }}</div>
                                </div>
                            </div>
                            <a href="{{ route('profile.edit') }}" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">الملف الشخصي</a>
                             <form method="POST" action="{{ route('logout') }}" class="mt-1">
                                @csrf
                                <button type="submit" class="block w-full text-right px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50">تسجيل خروج</button>
                            </form>
                        </div>
                     @endauth
                </nav>
            </div>

            <main class="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8">
                <div class="max-w-7xl mx-auto">
                    @if (session('success'))
                        <div class="rounded-xl bg-green-50 p-4 mb-6 border border-green-200 shadow-sm animate-fade-in-down">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <div class="mr-3">
                                    <p class="text-sm font-medium text-green-800">{{ session('success') }}</p>
                                </div>
                            </div>
                        </div>
                    @endif

                    @if (session('error'))
                         <div class="rounded-xl bg-red-50 p-4 mb-6 border border-red-200 shadow-sm animate-fade-in-down">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                                    </svg>
                                </div>
                                <div class="mr-3">
                                    <p class="text-sm font-medium text-red-800">{{ session('error') }}</p>
                                </div>
                            </div>
                        </div>
                    @endif

                    @if ($errors->any())
                        <div class="rounded-xl bg-red-50 p-4 mb-6 border border-red-200 shadow-sm animate-fade-in-down">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <div class="mr-3">
                                    <h3 class="text-sm font-medium text-red-800">يوجد بعض الأخطاء في المدخلات</h3>
                                    <div class="mt-2 text-sm text-red-700">
                                        <ul class="list-disc pr-5 space-y-1">
                                            @foreach ($errors->all() as $error)
                                                <li>{{ $error }}</li>
                                            @endforeach
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    @endif

                    @yield('content')
                </div>
            </main>
        </div>
    </div>

<script>
    // Handles PWA Installation
    let deferredPrompt;
    const installBtn = document.getElementById('install-btn');
    const mobileInstallBtn = document.getElementById('mobile-install-btn');
    const layoutBtns = [installBtn, mobileInstallBtn];

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show buttons
        layoutBtns.forEach(btn => {
            if(btn) btn.classList.remove('hidden');
        });
    });

    layoutBtns.forEach(btn => {
        if(btn) {
            btn.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
                if(outcome === 'accepted') {
                     layoutBtns.forEach(b => b.classList.add('hidden'));
                }
            });
        }
    });

    // Mobile Menu Toggle
    const btn = document.querySelector('#mobile-menu-btn');
    const menu = document.querySelector('#mobile-menu');

    if(btn && menu) {
        btn.addEventListener('click', () => {
            const isHidden = menu.classList.contains('hidden');
            if (isHidden) {
                menu.classList.remove('hidden');
                btn.setAttribute('aria-expanded', 'true');
            } else {
                menu.classList.add('hidden');
                btn.setAttribute('aria-expanded', 'false');
            }
        });
    }
</script>

<script>
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js');
        });
    }
</script>
</body>
</html>
