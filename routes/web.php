<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.perform');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/profile', [AuthController::class, 'showProfileForm'])->name('profile.edit');
    Route::post('/profile', [AuthController::class, 'updateProfile'])->name('profile.update');

    Route::get('/change-password', [AuthController::class, 'showChangePasswordForm'])->name('password.change');
    Route::post('/change-password', [AuthController::class, 'changePassword'])->name('password.change.perform');

    Route::resource('clients', ClientController::class);
    Route::resource('properties', PropertyController::class);
    Route::resource('units', UnitController::class);
    Route::resource('contracts', ContractController::class);
    Route::resource('payments', PaymentController::class);

    Route::post('contracts/{contract}/cancel', [ContractController::class, 'cancel'])->name('contracts.cancel');
    Route::post('contracts/{contract}/finish', [ContractController::class, 'finish'])->name('contracts.finish');

    Route::post('units/{unit}/change-status', [UnitController::class, 'changeStatus'])->name('units.changeStatus');

    Route::post('payments/{payment}/mark-late', [PaymentController::class, 'markLate'])->name('payments.markLate');
});
