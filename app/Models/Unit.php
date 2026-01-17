<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Unit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'property_id',
        'unit_number',
        'floor_number',
        'area',
        'rooms_count',
        'bathrooms_count',
        'status',
        'monthly_rent',
        'deposit_amount',
        'description',
        'features',
        'is_furnished',
        'has_kitchen',
        'has_balcony'
    ];

    protected $casts = [
        'area' => 'decimal:2',
        'monthly_rent' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'is_furnished' => 'boolean',
        'has_kitchen' => 'boolean',
        'has_balcony' => 'boolean',
        'features' => 'array',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
        'deleted_at' => 'datetime:Y-m-d H:i:s',
    ];

    // علاقة الوحدة بالعقار
    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    // علاقة الوحدة بالعقود
    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }

    // دالة للتحقق من أن الوحدة متاحة للإيجار
    public function isAvailable()
    {
        return $this->status === 'متاح';
    }

    // دالة للحصول على العقد النشط للوحدة
    public function activeContract()
    {
        return $this->hasOne(Contract::class)
            ->where('status', 'نشط')
            ->latest()
            ->limit(1);
    }

    // دالة للبحث عن وحدات بناءً على معايير محددة
    public function scopeSearch($query, $filters)
    {
        return $query->when($filters['status'] ?? null, function ($query, $status) {
            $query->where('status', $status);
        })->when($filters['min_rent'] ?? null, function ($query, $minRent) {
            $query->where('monthly_rent', '>=', $minRent);
        })->when($filters['max_rent'] ?? null, function ($query, $maxRent) {
            $query->where('monthly_rent', '<=', $maxRent);
        })->when($filters['rooms'] ?? null, function ($query, $rooms) {
            $query->where('rooms_count', $rooms);
        })->when($filters['property_id'] ?? null, function ($query, $propertyId) {
            $query->where('property_id', $propertyId);
        });
    }
}
