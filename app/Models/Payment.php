<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'payment_number',
        'contract_id',
        'client_id',
        'payment_date',
        'amount',
        'remaining_amount',
        'payment_method',
        'bank_name',
        'check_number',
        'check_date',
        'transaction_number',
        'start_date',
        'end_date',
        'status',
        'notes',
        'received_by',
        'late_fee',
        'discount',
        'discount_reason',
        'attachment'
    ];

    protected $casts = [
        'payment_date' => 'date:Y-m-d',
        'check_date' => 'date:Y-m-d',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'late_fee' => 'decimal:2',
        'discount' => 'decimal:2',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
        'deleted_at' => 'datetime:Y-m-d H:i:s',
    ];

    // علاقة الدفع بالعقد
    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    // علاقة الدفع بالعميل
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    // دالة للتحقق من أن الدفع متأخر
    public function isLate()
    {
        return $this->status === 'متأخر';
    }

    // دالة لحساب المبلغ الإجمالي (الإيجار + رسوم التأخير - الخصم)
    public function calculateTotalAmount()
    {
        return $this->amount + $this->late_fee - $this->discount;
    }

    // دالة لإنشاء رقم دفع فريد
    public static function generatePaymentNumber()
    {
        $prefix = 'PAY-';
        $date = now()->format('Ymd');
        $lastPayment = self::where('payment_number', 'like', "{$prefix}{$date}%")
            ->orderBy('id', 'desc')
            ->first();

        $number = $lastPayment ? 
            (int) substr($lastPayment->payment_number, -4) + 1 : 1;

        return $prefix . $date . str_pad($number, 4, '0', STR_PAD_LEFT);
    }

    // دالة للتحقق من صحة تاريخ الدفع
    public function isValidPaymentDate()
    {
        $paymentDate = Carbon::parse($this->payment_date);
        $contractStartDate = Carbon::parse($this->contract->start_date);
        $contractEndDate = Carbon::parse($this->contract->end_date);

        return $paymentDate->between($contractStartDate, $contractEndDate);
    }

    // دالة لحساب عدد أيام التأخير
    public function calculateLateDays()
    {
        $dueDate = Carbon::parse($this->end_date);
        $paymentDate = Carbon::parse($this->payment_date);
        
        if ($paymentDate->gt($dueDate)) {
            return $paymentDate->diffInDays($dueDate);
        }
        
        return 0;
    }

    // دالة لحساب رسوم التأخير
    public function calculateLateFee($dailyRate = null)
    {
        if (is_null($dailyRate)) {
            $dailyRate = $this->contract->monthly_rent * 0.01; // 1% من الإيجار الشهري
        }

        $lateDays = $this->calculateLateDays();
        return $lateDays * $dailyRate;
    }
}
