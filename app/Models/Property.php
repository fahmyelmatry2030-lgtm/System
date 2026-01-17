<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Property extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'address',
        'type',
        'floors_count',
        'units_count',
        'city',
        'district',
        'description',
        'has_elevator',
        'has_parking',
        'is_active'
    ];

    protected $casts = [
        'has_elevator' => 'boolean',
        'has_parking' => 'boolean',
        'is_active' => 'boolean',
        'floors_count' => 'integer',
        'units_count' => 'integer',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
        'deleted_at' => 'datetime:Y-m-d H:i:s',
    ];

    // علاقة العقار بالوحدات
    public function units()
    {
        return $this->hasMany(Unit::class);
    }

    // دالة للحصول على عدد الوحدات المتاحة
    public function availableUnitsCount()
    {
        return $this->units()->where('status', 'متاح')->count();
    }

    // دالة للتحقق من وجود وحدات متاحة
    public function hasAvailableUnits()
    {
        return $this->availableUnitsCount() > 0;
    }

    // دالة للحصول على عدد الوحدات المؤجرة
    public function rentedUnitsCount()
    {
        return $this->units()->where('status', 'مؤجر')->count();
    }

    // دالة للحصول على متوسط سعر الإيجار
    public function averageRent()
    {
        return $this->units()->avg('monthly_rent');
    }

    // دالة للبحث عن وحدات بناءً على معايير محددة
    public function scopeSearch($query, $filters)
    {
        return $query->when($filters['type'] ?? null, function ($query, $type) {
            $query->where('type', $type);
        })->when($filters['city'] ?? null, function ($query, $city) {
            $query->where('city', 'like', "%$city%");
        })->when($filters['district'] ?? null, function ($query, $district) {
            $query->where('district', 'like', "%$district%");
        });
    }
}
