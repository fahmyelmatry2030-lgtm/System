<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Property;
use App\Models\Unit;
use App\Models\Contract;
use App\Models\Payment;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $stats = [
            'clients' => Client::count(),
            'properties' => Property::count(),
            'units' => Unit::count(),
            'units_available' => Unit::where('status', 'متاح')->count(),
            'units_rented' => Unit::where('status', 'مؤجر')->count(),
            'contracts_active' => Contract::where('status', 'نشط')->count(),
            'payments_total' => Payment::sum('amount'),
            'payments_late' => Payment::where('status', 'متأخر')->count(),
            'payments_month' => Payment::whereYear('payment_date', now()->year)
                ->whereMonth('payment_date', now()->month)
                ->sum('amount'),
        ];

        $latestPayments = Payment::with(['client', 'contract'])
            ->latest('payment_date')
            ->limit(10)
            ->get();

        return view('dashboard.index', compact('stats', 'latestPayments'));
    }
}
