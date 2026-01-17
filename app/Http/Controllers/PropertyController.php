<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PropertyController extends Controller
{
    // عرض قائمة العقارات
    public function index(Request $request)
    {
        $query = Property::query()->withCount(['units', 'units as available_units_count' => function($q) {
            $q->where('status', 'متاح');
        }]);
        
        // البحث عن العقارات
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('district', 'like', "%{$search}%");
            });
        }
        
        // تصفية حسب نوع العقار
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        
        // تصفية حسب المدينة
        if ($request->has('city')) {
            $query->where('city', $request->city);
        }
        
        $properties = $query->latest()->paginate(10);
        
        return view('properties.index', compact('properties'));
    }

    // عرض نموذج إضافة عقار جديد
    public function create()
    {
        $cities = $this->getCities();
        $districts = $this->getDistricts();
        return view('properties.create', compact('cities', 'districts'));
    }

    // حفظ العقار الجديد
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:شقة,فيلا,عمارة,محل تجاري,أرض',
            'address' => 'required|string',
            'city' => 'required|string',
            'district' => 'required|string',
            'floors_count' => 'required|integer|min:1',
            'units_count' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'has_elevator' => 'boolean',
            'has_parking' => 'boolean'
        ]);

        try {
            DB::beginTransaction();
            
            // تحويل القيم المنطقية
            $validated['has_elevator'] = $request->boolean('has_elevator');
            $validated['has_parking'] = $request->boolean('has_parking');
            
            $property = Property::create($validated);
            
            DB::commit();
            
            return redirect()->route('properties.show', $property->id)
                ->with('success', 'تمت إضافة العقار بنجاح');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'حدث خطأ أثناء حفظ البيانات: ' . $e->getMessage());
        }
    }

    // عرض تفاصيل العقار
    public function show(Property $property)
    {
        $property->load(['units' => function($query) {
            $query->withCount('contracts');
        }]);
        
        $availableUnits = $property->units()->where('status', 'متاح')->count();
        $rentedUnits = $property->units()->where('status', 'مؤجر')->count();
        $underMaintenance = $property->units()->where('status', 'صيانة')->count();
        
        // إحصائيات الوحدات
        $unitStats = [
            'total' => $property->units_count,
            'available' => $availableUnits,
            'rented' => $rentedUnits,
            'under_maintenance' => $underMaintenance,
            'occupancy_rate' => $property->units_count > 0 ? 
                round(($rentedUnits / $property->units_count) * 100, 2) : 0
        ];
        
        return view('properties.show', compact('property', 'unitStats'));
    }

    // عرض نموذج تعديل العقار
    public function edit(Property $property)
    {
        $cities = $this->getCities();
        $districts = $this->getDistricts();
        return view('properties.edit', compact('property', 'cities', 'districts'));
    }

    // تحديث بيانات العقار
    public function update(Request $request, Property $property)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:شقة,فيلا,عمارة,محل تجاري,أرض',
            'address' => 'required|string',
            'city' => 'required|string',
            'district' => 'required|string',
            'floors_count' => 'required|integer|min:1',
            'units_count' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'has_elevator' => 'boolean',
            'has_parking' => 'boolean',
            'is_active' => 'boolean',
            
        ]);

        try {
            DB::beginTransaction();
            
            // تحديث الحقول المنطقية
            $validated['has_elevator'] = $request->boolean('has_elevator');
            $validated['has_parking'] = $request->boolean('has_parking');
            $validated['is_active'] = $request->boolean('is_active');
            
            $property->update($validated);
            
            DB::commit();
            
            return redirect()->route('properties.show', $property->id)
                ->with('success', 'تم تحديث بيانات العقار بنجاح');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'حدث خطأ أثناء تحديث البيانات: ' . $e->getMessage());
        }
    }

    // حذف العقار
    public function destroy(Property $property)
    {
        try {
            // التحقق من وجود وحدات مرتبطة بالعقار
            if ($property->units()->exists()) {
                return back()->with('error', 'لا يمكن حذف العقار لوجود وحدات مرتبطة به');
            }
            
            $property->delete();
            
            return redirect()->route('properties.index')
                ->with('success', 'تم حذف العقار بنجاح');
                
        } catch (\Exception $e) {
            return back()->with('error', 'حدث خطأ أثناء حذف العقار: ' . $e->getMessage());
        }
    }
    
    // الحصول على قائمة المدن
    private function getCities()
    {
        // يمكن استبدال هذا بمصدر بيانات حقيقي
        return [
            'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام',
            'الخبر', 'الظهران', 'الطائف', 'بريدة', 'تبوك', 'الأحساء'
        ];
    }
    
    // الحصول على قائمة الأحياء
    private function getDistricts()
    {
        // يمكن استبدال هذا بمصدر بيانات حقيقي
        return [
            'الحي الأول', 'الحي الثاني', 'الحي الثالث', 'الحي الرابع',
            'الحي الخامس', 'الحي السادس', 'الحي السابع', 'الحي الثامن'
        ];
    }
    
    // الحصول على وحدات العقار
    public function getPropertyUnits(Property $property)
    {
        $units = $property->units()->with('activeContract')->get();
        return response()->json($units);
    }
    
    // الحصول على إحصائيات العقار
    public function getPropertyStats(Property $property)
    {
        $totalUnits = $property->units_count;
        $availableUnits = $property->units()->where('status', 'متاح')->count();
        $rentedUnits = $property->units()->where('status', 'مؤجر')->count();
        $underMaintenance = $property->units()->where('status', 'صيانة')->count();
        
        return response()->json([
            'total_units' => $totalUnits,
            'available_units' => $availableUnits,
            'rented_units' => $rentedUnits,
            'under_maintenance' => $underMaintenance,
            'occupancy_rate' => $totalUnits > 0 ? 
                round(($rentedUnits / $totalUnits) * 100, 2) : 0,
            'monthly_income' => $property->units()->sum('monthly_rent')
        ]);
    }
}
