<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Contract extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'contract_number',
        'client_id',
        'unit_id',
        'start_date',
        'end_date',
        'monthly_rent',
        'deposit_amount',
        'payment_day',
        'contract_type',
        'payment_method',
        'notes',
        'terms',
        'status',
        'cancellation_date',
        'cancellation_reason',
        'landlord_signature',
        'tenant_signature',
        'witness_name',
        'witness_phone'
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'cancellation_date' => 'date:Y-m-d',
        'monthly_rent' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'terms' => 'array',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
        'deleted_at' => 'datetime:Y-m-d H:i:s',
    ];

    // علاقة العقد بالعميل
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    // علاقة العقد بالوحدة
    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    // علاقة العقد بالمدفوعات
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // دالة للتحقق من أن العقد نشط
    public function isActive()
    {
        return $this->status === 'نشط' && 
               Carbon::now()->between(
                   $this->start_date, 
                   $this->end_date
               );
    }

    // دالة لحساب المدة المتبقية للعقد
    public function remainingDays()
    {
        if ($this->status !== 'نشط') {
            return 0;
        }

        $endDate = Carbon::parse($this->end_date);
        $now = Carbon::now();
        
        return $now->diffInDays($endDate, false);
    }

    // دالة لحساب إجمالي المدفوعات
    public function totalPaid()
    {
        return $this->payments()->sum('amount');
    }

    // دالة لحساب المتبقي من مبلغ الضمان
    public function remainingDeposit()
    {
        return $this->deposit_amount - $this->totalPaid();
    }

    // دالة للتحقق من وجود مدفوعات متأخرة
    public function hasLatePayments()
    {
        return $this->payments()
            ->where('status', 'متأخر')
            ->exists();
    }

    // دالة لإنشاء رقم عقد فريد
    public static function generateContractNumber()
    {
        $prefix = 'CON-';
        $date = now()->format('Ymd');
        $lastContract = self::where('contract_number', 'like', "{$prefix}{$date}%")
            ->orderBy('id', 'desc')
            ->first();

        $number = $lastContract ? 
            (int) substr($lastContract->contract_number, -4) + 1 : 1;

        return $prefix . $date . str_pad($number, 4, '0', STR_PAD_LEFT);
    }
}
