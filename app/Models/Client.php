<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'national_id',
        'address',
        'client_type',
        'notes'
    ];

    protected $casts = [
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
        'deleted_at' => 'datetime:Y-m-d H:i:s',
    ];

    // علاقة العميل بالعقود
    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }

    // علاقة العميل بالمدفوعات
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // دالة للحصول على إجمالي المدفوعات
    public function totalPayments()
    {
        return $this->payments()->sum('amount');
    }

    // دالة للتحقق من وجود مدفوعات متأخرة
    public function hasLatePayments()
    {
        return $this->payments()
            ->where('status', 'متأخر')
            ->exists();
    }
}
