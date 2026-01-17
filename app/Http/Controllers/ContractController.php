<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\Client;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ContractController extends Controller
{
    public function index(Request $request)
    {
        $query = Contract::query()->with(['client', 'unit.property']);

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('contract_number', 'like', "%{$search}%")
                    ->orWhereHas('client', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%")
                            ->orWhere('national_id', 'like', "%{$search}%");
                    })
                    ->orWhereHas('unit', function ($q) use ($search) {
                        $q->where('unit_number', 'like', "%{$search}%")
                            ->orWhereHas('property', function ($q) use ($search) {
                                $q->where('name', 'like', "%{$search}%")
                                    ->orWhere('address', 'like', "%{$search}%");
                            });
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->input('client_id'));
        }

        if ($request->filled('unit_id')) {
            $query->where('unit_id', $request->input('unit_id'));
        }

        if ($request->filled('start_date_from')) {
            $query->whereDate('start_date', '>=', $request->input('start_date_from'));
        }

        if ($request->filled('start_date_to')) {
            $query->whereDate('start_date', '<=', $request->input('start_date_to'));
        }

        $contracts = $query->latest()->paginate(15);

        return view('contracts.index', compact('contracts'));
    }

    public function create()
    {
        $clients = Client::query()->select('id', 'name', 'phone')->orderBy('name')->get();

        $units = Unit::query()
            ->where('status', 'متاح')
            ->with('property:id,name')
            ->orderBy('unit_number')
            ->get();

        return view('contracts.create', compact('clients', 'units'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'unit_id' => 'required|exists:units,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'monthly_rent' => 'required|numeric|min:0',
            'deposit_amount' => 'required|numeric|min:0',
            'payment_day' => 'required|integer|min:1|max:28',
            'contract_type' => 'required|in:سكني,تجاري,إداري',
            'payment_method' => 'required|in:تحويل بنكي,شيك,نقدي',
            'notes' => 'nullable|string',
            'terms' => 'nullable',
            'witness_name' => 'nullable|string|max:255',
            'witness_phone' => 'nullable|string|max:50',
        ]);

        if ($request->filled('terms') && is_string($request->input('terms'))) {
            $decoded = json_decode($request->input('terms'), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $validated['terms'] = $decoded;
            }
        }

        try {
            DB::beginTransaction();

            $unit = Unit::lockForUpdate()->findOrFail($validated['unit_id']);
            if ($unit->status !== 'متاح') {
                DB::rollBack();
                return back()->withInput()->with('error', 'لا يمكن إنشاء عقد: الوحدة غير متاحة حالياً.');
            }

            $validated['contract_number'] = Contract::generateContractNumber();
            $validated['status'] = 'نشط';

            $contract = Contract::create($validated);

            $unit->update(['status' => 'مؤجر']);

            DB::commit();

            return redirect()->route('contracts.show', $contract)
                ->with('success', 'تم إنشاء العقد بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'حدث خطأ أثناء حفظ العقد: ' . $e->getMessage());
        }
    }

    public function show(Contract $contract)
    {
        $contract->load(['client', 'unit.property', 'payments' => function ($q) {
            $q->latest('payment_date');
        }]);

        return view('contracts.show', compact('contract'));
    }

    public function edit(Contract $contract)
    {
        $clients = Client::query()->select('id', 'name', 'phone')->orderBy('name')->get();

        $units = Unit::query()
            ->where(function ($q) use ($contract) {
                $q->where('status', 'متاح')
                    ->orWhere('id', $contract->unit_id);
            })
            ->with('property:id,name')
            ->orderBy('unit_number')
            ->get();

        return view('contracts.edit', compact('contract', 'clients', 'units'));
    }

    public function update(Request $request, Contract $contract)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'unit_id' => 'required|exists:units,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'monthly_rent' => 'required|numeric|min:0',
            'deposit_amount' => 'required|numeric|min:0',
            'payment_day' => 'required|integer|min:1|max:28',
            'contract_type' => 'required|in:سكني,تجاري,إداري',
            'payment_method' => 'required|in:تحويل بنكي,شيك,نقدي',
            'notes' => 'nullable|string',
            'terms' => 'nullable',
            'status' => 'required|in:نشط,منتهي,ملغي',
            'cancellation_date' => 'nullable|date',
            'cancellation_reason' => 'nullable|string',
            'witness_name' => 'nullable|string|max:255',
            'witness_phone' => 'nullable|string|max:50',
        ]);

        if ($request->filled('terms') && is_string($request->input('terms'))) {
            $decoded = json_decode($request->input('terms'), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $validated['terms'] = $decoded;
            }
        }

        try {
            DB::beginTransaction();

            $oldUnitId = $contract->unit_id;
            $newUnitId = (int) $validated['unit_id'];

            if ($newUnitId !== $oldUnitId) {
                $newUnit = Unit::lockForUpdate()->findOrFail($newUnitId);
                if ($newUnit->status !== 'متاح') {
                    DB::rollBack();
                    return back()->withInput()->with('error', 'لا يمكن تغيير الوحدة: الوحدة الجديدة غير متاحة.');
                }

                $oldUnit = Unit::lockForUpdate()->findOrFail($oldUnitId);
                if ($contract->status === 'نشط') {
                    $oldUnit->update(['status' => 'متاح']);
                    $newUnit->update(['status' => 'مؤجر']);
                }
            }

            if ($validated['status'] === 'ملغي') {
                if (empty($validated['cancellation_date'])) {
                    $validated['cancellation_date'] = Carbon::now()->toDateString();
                }
            } else {
                $validated['cancellation_date'] = null;
                $validated['cancellation_reason'] = null;
            }

            $contract->update($validated);

            DB::commit();

            return redirect()->route('contracts.show', $contract)
                ->with('success', 'تم تحديث بيانات العقد بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'حدث خطأ أثناء تحديث العقد: ' . $e->getMessage());
        }
    }

    public function destroy(Contract $contract)
    {
        try {
            if ($contract->payments()->exists()) {
                return back()->with('error', 'لا يمكن حذف العقد لوجود مدفوعات مرتبطة به');
            }

            DB::beginTransaction();

            if ($contract->status === 'نشط') {
                $unit = Unit::lockForUpdate()->find($contract->unit_id);
                if ($unit) {
                    $unit->update(['status' => 'متاح']);
                }
            }

            $contract->delete();

            DB::commit();

            return redirect()->route('contracts.index')->with('success', 'تم حذف العقد بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'حدث خطأ أثناء حذف العقد: ' . $e->getMessage());
        }
    }

    public function cancel(Request $request, Contract $contract)
    {
        $validated = $request->validate([
            'cancellation_reason' => 'required|string',
            'cancellation_date' => 'nullable|date',
        ]);

        try {
            DB::beginTransaction();

            $contract->update([
                'status' => 'ملغي',
                'cancellation_reason' => $validated['cancellation_reason'],
                'cancellation_date' => $validated['cancellation_date'] ?? Carbon::now()->toDateString(),
            ]);

            $unit = Unit::lockForUpdate()->find($contract->unit_id);
            if ($unit) {
                $unit->update(['status' => 'متاح']);
            }

            DB::commit();

            return redirect()->route('contracts.show', $contract)->with('success', 'تم إلغاء العقد بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'حدث خطأ أثناء إلغاء العقد: ' . $e->getMessage());
        }
    }

    public function finish(Contract $contract)
    {
        try {
            DB::beginTransaction();

            $contract->update(['status' => 'منتهي']);

            $unit = Unit::lockForUpdate()->find($contract->unit_id);
            if ($unit) {
                $unit->update(['status' => 'متاح']);
            }

            DB::commit();

            return redirect()->route('contracts.show', $contract)->with('success', 'تم إنهاء العقد بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'حدث خطأ أثناء إنهاء العقد: ' . $e->getMessage());
        }
    }
}
