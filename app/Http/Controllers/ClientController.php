<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    // عرض قائمة العملاء
    public function index(Request $request)
    {
        $query = Client::query();
        
        // البحث عن العملاء
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('national_id', 'like', "%{$search}%");
            });
        }
        
        // تصفية حسب نوع العميل
        if ($request->has('client_type')) {
            $query->where('client_type', $request->client_type);
        }
        
        $clients = $query->latest()->paginate(15);
        
        return view('clients.index', compact('clients'));
    }

    // عرض نموذج إضافة عميل جديد
    public function create()
    {
        return view('clients.create');
    }

    // حفظ العميل الجديد
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:clients,email',
            'phone' => 'required|string|unique:clients,phone',
            'national_id' => 'required|string|unique:clients,national_id',
            'address' => 'nullable|string',
            'client_type' => 'required|in:فرد,شركة',
            'notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();
            
            $client = Client::create($validated);
            
            DB::commit();
            
            return redirect()->route('clients.show', $client->id)
                ->with('success', 'تمت إضافة العميل بنجاح');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'حدث خطأ أثناء حفظ البيانات: ' . $e->getMessage());
        }
    }

    // عرض تفاصيل العميل
    public function show(Client $client)
    {
        $client->load(['contracts' => function($query) {
            $query->with('unit.property')->latest();
        }, 'payments' => function($query) {
            $query->with('contract')->latest()->limit(5);
        }]);
        
        $totalPaid = $client->totalPayments();
        $hasLatePayments = $client->hasLatePayments();
        
        return view('clients.show', compact('client', 'totalPaid', 'hasLatePayments'));
    }

    // عرض نموذج تعديل العميل
    public function edit(Client $client)
    {
        return view('clients.edit', compact('client'));
    }

    // تحديث بيانات العميل
    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'nullable',
                'email',
                Rule::unique('clients')->ignore($client->id)
            ],
            'phone' => [
                'required',
                'string',
                Rule::unique('clients')->ignore($client->id)
            ],
            'national_id' => [
                'required',
                'string',
                Rule::unique('clients')->ignore($client->id)
            ],
            'address' => 'nullable|string',
            'client_type' => 'required|in:فرد,شركة',
            'notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();
            
            $client->update($validated);
            
            DB::commit();
            
            return redirect()->route('clients.show', $client->id)
                ->with('success', 'تم تحديث بيانات العميل بنجاح');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'حدث خطأ أثناء تحديث البيانات: ' . $e->getMessage());
        }
    }

    // حذف العميل
    public function destroy(Client $client)
    {
        try {
            // التحقق من وجود عقود أو مدفوعات مرتبطة بالعميل
            if ($client->contracts()->exists() || $client->payments()->exists()) {
                return back()->with('error', 'لا يمكن حذف العميل لوجود سجلات مرتبطة به');
            }
            
            $client->delete();
            
            return redirect()->route('clients.index')
                ->with('success', 'تم حذف العميل بنجاح');
                
        } catch (\Exception $e) {
            return back()->with('error', 'حدث خطأ أثناء حذف العميل: ' . $e->getMessage());
        }
    }

    // الحصول على بيانات العميل كـ JSON
    public function getClientData(Client $client)
    {
        return response()->json([
            'client' => $client,
            'contracts' => $client->contracts()->with('unit.property')->get(),
            'total_payments' => $client->totalPayments(),
            'has_late_payments' => $client->hasLatePayments()
        ]);
    }
}
