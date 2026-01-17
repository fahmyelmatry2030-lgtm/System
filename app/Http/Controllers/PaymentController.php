<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Contract;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::query()->with(['contract.unit.property', 'client']);

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('payment_number', 'like', "%{$search}%")
                    ->orWhereHas('client', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%")
                            ->orWhere('national_id', 'like', "%{$search}%");
                    })
                    ->orWhereHas('contract', function ($q) use ($search) {
                        $q->where('contract_number', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->input('payment_method'));
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->input('client_id'));
        }

        if ($request->filled('contract_id')) {
            $query->where('contract_id', $request->input('contract_id'));
        }

        if ($request->filled('payment_date_from')) {
            $query->whereDate('payment_date', '>=', $request->input('payment_date_from'));
        }

        if ($request->filled('payment_date_to')) {
            $query->whereDate('payment_date', '<=', $request->input('payment_date_to'));
        }

        $payments = $query->latest('payment_date')->paginate(20);

        return view('payments.index', compact('payments'));
    }

    public function create(Request $request)
    {
        $contracts = Contract::query()
            ->with(['client:id,name,phone', 'unit:id,unit_number,property_id', 'unit.property:id,name'])
            ->latest()
            ->get();

        $clients = Client::query()->select('id', 'name', 'phone')->orderBy('name')->get();

        $selectedContractId = $request->integer('contract_id') ?: null;
        $selectedClientId = null;

        if (!is_null($selectedContractId)) {
            $selectedContract = Contract::query()->select('id', 'client_id')->find($selectedContractId);
            if ($selectedContract) {
                $selectedClientId = $selectedContract->client_id;
            }
        }

        return view('payments.create', compact('contracts', 'clients', 'selectedContractId', 'selectedClientId'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contract_id' => 'required|exists:contracts,id',
            'client_id' => 'required|exists:clients,id',
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'remaining_amount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:نقدي,تحويل بنكي,شيك,حوالة',
            'bank_name' => 'nullable|string|max:255',
            'check_number' => 'nullable|string|max:255',
            'check_date' => 'nullable|date',
            'transaction_number' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:مدفوع,مدفوع جزئياً,متأخر,ملغي',
            'notes' => 'nullable|string',
            'received_by' => 'required|string|max:255',
            'late_fee' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'discount_reason' => 'nullable|string',
            'attachment' => 'nullable|file|max:5120',
        ]);

        try {
            DB::beginTransaction();

            $contract = Contract::query()->with('client')->findOrFail($validated['contract_id']);

            if ((int) $validated['client_id'] !== (int) $contract->client_id) {
                DB::rollBack();
                return back()->withInput()->with('error', 'العميل المحدد لا يطابق عميل العقد.');
            }

            $validated['payment_number'] = Payment::generatePaymentNumber();
            $validated['late_fee'] = $validated['late_fee'] ?? 0;
            $validated['discount'] = $validated['discount'] ?? 0;
            $validated['remaining_amount'] = $validated['remaining_amount'] ?? 0;

            if ($request->hasFile('attachment')) {
                $validated['attachment'] = $request->file('attachment')->store('payments', 'public');
            }

            $payment = Payment::create($validated);

            DB::commit();

            return redirect()->route('payments.show', $payment)->with('success', 'تم تسجيل الدفعة بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'حدث خطأ أثناء حفظ الدفعة: ' . $e->getMessage());
        }
    }

    public function show(Payment $payment)
    {
        $payment->load(['contract.unit.property', 'client']);
        return view('payments.show', compact('payment'));
    }

    public function edit(Payment $payment)
    {
        $payment->load(['contract', 'client']);

        $contracts = Contract::query()
            ->with(['client:id,name,phone', 'unit:id,unit_number,property_id', 'unit.property:id,name'])
            ->latest()
            ->get();

        $clients = Client::query()->select('id', 'name', 'phone')->orderBy('name')->get();

        return view('payments.edit', compact('payment', 'contracts', 'clients'));
    }

    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'contract_id' => 'required|exists:contracts,id',
            'client_id' => 'required|exists:clients,id',
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'remaining_amount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:نقدي,تحويل بنكي,شيك,حوالة',
            'bank_name' => 'nullable|string|max:255',
            'check_number' => 'nullable|string|max:255',
            'check_date' => 'nullable|date',
            'transaction_number' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:مدفوع,مدفوع جزئياً,متأخر,ملغي',
            'notes' => 'nullable|string',
            'received_by' => 'required|string|max:255',
            'late_fee' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'discount_reason' => 'nullable|string',
            'attachment' => 'nullable|file|max:5120',
            'delete_attachment' => 'nullable|boolean',
        ]);

        try {
            DB::beginTransaction();

            $contract = Contract::query()->with('client')->findOrFail($validated['contract_id']);
            if ((int) $validated['client_id'] !== (int) $contract->client_id) {
                DB::rollBack();
                return back()->withInput()->with('error', 'العميل المحدد لا يطابق عميل العقد.');
            }

            $validated['late_fee'] = $validated['late_fee'] ?? 0;
            $validated['discount'] = $validated['discount'] ?? 0;
            $validated['remaining_amount'] = $validated['remaining_amount'] ?? 0;

            $deleteAttachment = (bool) $request->input('delete_attachment', false);
            if ($deleteAttachment && !empty($payment->attachment)) {
                if (Storage::disk('public')->exists($payment->attachment)) {
                    Storage::disk('public')->delete($payment->attachment);
                }
                $validated['attachment'] = null;
            }

            if ($request->hasFile('attachment')) {
                if (!empty($payment->attachment) && Storage::disk('public')->exists($payment->attachment)) {
                    Storage::disk('public')->delete($payment->attachment);
                }
                $validated['attachment'] = $request->file('attachment')->store('payments', 'public');
            }

            $payment->update($validated);

            DB::commit();

            return redirect()->route('payments.show', $payment)->with('success', 'تم تحديث الدفعة بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'حدث خطأ أثناء تحديث الدفعة: ' . $e->getMessage());
        }
    }

    public function destroy(Payment $payment)
    {
        try {
            if (!empty($payment->attachment) && Storage::disk('public')->exists($payment->attachment)) {
                Storage::disk('public')->delete($payment->attachment);
            }

            $payment->delete();

            return redirect()->route('payments.index')->with('success', 'تم حذف الدفعة بنجاح');
        } catch (\Exception $e) {
            return back()->with('error', 'حدث خطأ أثناء حذف الدفعة: ' . $e->getMessage());
        }
    }

    public function markLate(Payment $payment)
    {
        try {
            $payment->update([
                'status' => 'متأخر',
                'late_fee' => $payment->late_fee ?? $payment->calculateLateFee(),
            ]);

            return redirect()->route('payments.show', $payment)->with('success', 'تم تحديث حالة الدفعة إلى متأخر');
        } catch (\Exception $e) {
            return back()->with('error', 'حدث خطأ أثناء تحديث حالة الدفعة: ' . $e->getMessage());
        }
    }
}
