<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UnitController extends Controller
{
    // عرض قائمة الوحدات السكنية
    public function index(Request $request)
    {
        $query = Unit::with(['property', 'activeContract.client']);
        
        // البحث عن وحدات
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('unit_number', 'like', "%{$search}%")
                  ->orWhereHas('property', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                  });
            });
        }
        
        // تصفية حسب حالة الوحدة
        if ($request->has('status') && in_array($request->status, ['متاح', 'مؤجر', 'محجوز', 'صيانة'])) {
            $query->where('status', $request->status);
        }
        
        // تصفية حسب العقار
        if ($request->has('property_id')) {
            $query->where('property_id', $request->property_id);
        }
        
        $units = $query->latest()->paginate(15);
        $properties = Property::select('id', 'name')->get();
        
        return view('units.index', compact('units', 'properties'));
    }

    // عرض نموذج إضافة وحدة سكنية جديدة
    public function create()
    {
        $properties = Property::select('id', 'name')->get();
        $statuses = ['متاح' => 'متاح', 'مؤجر' => 'مؤجر', 'محجوز' => 'محجوز', 'صيانة' => 'صيانة'];

        return view('units.create', compact('properties', 'statuses'));
    }

    // حفظ الوحدة السكنية الجديدة
    public function store(Request $request)
    {
        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'unit_number' => 'required|string|max:50',
            'floor_number' => 'required|integer|min:-5|max:100',
            'rooms_count' => 'required|integer|min:0',
            'bathrooms_count' => 'required|integer|min:0',
            'area' => 'required|numeric|min:0',
            'monthly_rent' => 'required|numeric|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            'status' => 'required|in:متاح,مؤجر,محجوز,صيانة',
            'is_furnished' => 'boolean',
            'has_balcony' => 'boolean',
            'has_kitchen' => 'boolean',
            'description' => 'nullable|string',
            'features' => 'nullable'
        ]);

        if ($request->filled('features') && is_string($request->input('features'))) {
            $decoded = json_decode($request->input('features'), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $validated['features'] = $decoded;
            }
        }

        try {
            DB::beginTransaction();
            
            // تحويل القيم المنطقية
            $validated['is_furnished'] = $request->has('is_furnished');
            $validated['has_balcony'] = $request->has('has_balcony');
            $validated['has_kitchen'] = $request->has('has_kitchen');
            $validated['deposit_amount'] = $validated['deposit_amount'] ?? 0;
            
            $unit = Unit::create($validated);
            
            DB::commit();
            
            return redirect()->route('units.show', $unit->id)
                ->with('success', 'تمت إضافة الوحدة السكنية بنجاح');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'حدث خطأ أثناء حفظ البيانات: ' . $e->getMessage());
        }
    }

    // عرض تفاصيل الوحدة السكنية
    public function show(Unit $unit)
    {
        $unit->load(['property', 'contracts' => function($query) {
            $query->with('client')->latest();
        }]);
        
        $activeContract = $unit->activeContract;
        $contracts = $unit->contracts()->with('client')->paginate(5);
        
        return view('units.show', compact('unit', 'activeContract', 'contracts'));
    }

    // عرض نموذج تعديل الوحدة السكنية
    public function edit(Unit $unit)
    {
        $properties = Property::select('id', 'name')->get();
        $statuses = ['متاح' => 'متاح', 'مؤجر' => 'مؤجر', 'محجوز' => 'محجوز', 'صيانة' => 'صيانة'];

        return view('units.edit', compact('unit', 'properties', 'statuses'));
    }

    // تحديث بيانات الوحدة السكنية
    public function update(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'unit_number' => 'required|string|max:50',
            'floor_number' => 'required|integer|min:-5|max:100',
            'rooms_count' => 'required|integer|min:0',
            'bathrooms_count' => 'required|integer|min:0',
            'area' => 'required|numeric|min:0',
            'monthly_rent' => 'required|numeric|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            'status' => 'required|in:متاح,مؤجر,محجوز,صيانة',
            'is_furnished' => 'boolean',
            'has_balcony' => 'boolean',
            'has_kitchen' => 'boolean',
            'description' => 'nullable|string',
            'features' => 'nullable'
        ]);

        if ($request->filled('features') && is_string($request->input('features'))) {
            $decoded = json_decode($request->input('features'), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $validated['features'] = $decoded;
            }
        }

        try {
            DB::beginTransaction();
            
            // تحويل القيم المنطقية
            $validated['is_furnished'] = $request->has('is_furnished');
            $validated['has_balcony'] = $request->has('has_balcony');
            $validated['has_kitchen'] = $request->has('has_kitchen');
            $validated['deposit_amount'] = $validated['deposit_amount'] ?? 0;
            
            $unit->update($validated);
            
            DB::commit();
            
            return redirect()->route('units.show', $unit->id)
                ->with('success', 'تم تحديث بيانات الوحدة السكنية بنجاح');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'حدث خطأ أثناء تحديث البيانات: ' . $e->getMessage());
        }
    }

    // حذف الوحدة السكنية
    public function destroy(Unit $unit)
    {
        try {
            // التحقق من وجود عقود مرتبطة بالوحدة
            if ($unit->contracts()->exists()) {
                return back()->with('error', 'لا يمكن حذف الوحدة لوجود عقود مرتبطة بها');
            }
            
            $unit->delete();
            
            return redirect()->route('units.index')
                ->with('success', 'تم حذف الوحدة السكنية بنجاح');
                
        } catch (\Exception $e) {
            return back()->with('error', 'حدث خطأ أثناء حذف الوحدة: ' . $e->getMessage());
        }
    }
    
    // الحصول على وحدات العقار
    public function getUnitsByProperty(Property $property)
    {
        $units = $property->units()
            ->where('status', 'متاح')
            ->select('id', 'unit_number', 'monthly_rent')
            ->get();
            
        return response()->json($units);
    }
    
    // الحصول على تفاصيل الوحدة
    public function getUnitDetails(Unit $unit)
    {
        $unit->load('property');
        return response()->json([
            'id' => $unit->id,
            'unit_number' => $unit->unit_number,
            'floor_number' => $unit->floor_number,
            'area' => $unit->area,
            'monthly_rent' => $unit->monthly_rent,
            'property_name' => $unit->property->name,
            'property_address' => $unit->property->address
        ]);
    }
    
    // تغيير حالة الوحدة
    public function changeStatus(Request $request, Unit $unit)
    {
        $request->validate([
            'status' => 'required|in:متاح,مؤجر,محجوز,صيانة'
        ]);
        
        try {
            if ($request->status === 'متاح') {
                $hasActiveContract = $unit->contracts()
                    ->where('status', 'نشط')
                    ->exists();
 
                if ($hasActiveContract) {
                    return response()->json([
                        'success' => false,
                        'message' => 'لا يمكن جعل الوحدة متاحة لوجود عقد نشط مرتبط بها.'
                    ], 422);
                }
            }

            $unit->update(['status' => $request->status]);
            return response()->json([
                'success' => true,
                'message' => 'تم تحديث حالة الوحدة بنجاح',
                'status' => $unit->status
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث حالة الوحدة: ' . $e->getMessage()
            ], 500);
        }
    }
}
