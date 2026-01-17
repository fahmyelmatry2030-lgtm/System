<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number')->unique();
            $table->foreignId('contract_id')->constrained()->onDelete('restrict');
            $table->foreignId('client_id')->constrained()->onDelete('restrict');
            
            // تفاصيل المدفوعات
            $table->date('payment_date');
            $table->decimal('amount', 12, 2);
            $table->decimal('remaining_amount', 12, 2)->default(0);
            $table->enum('payment_method', ['نقدي', 'تحويل بنكي', 'شيك', 'حوالة']);
            $table->string('bank_name')->nullable();
            $table->string('check_number')->nullable();
            $table->date('check_date')->nullable();
            $table->string('transaction_number')->nullable();
            
            // الفترة التي يغطيها الدفع
            $table->date('start_date');
            $table->date('end_date');
            
            // حالة الدفع
            $table->enum('status', ['مدفوع', 'مدفوع جزئياً', 'متأخر', 'ملغي'])->default('مدفوع');
            
            // معلومات إضافية
            $table->text('notes')->nullable();
            $table->string('received_by');
            
            // للمدفوعات المتأخرة
            $table->decimal('late_fee', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->text('discount_reason')->nullable();
            
            // للمستندات المرفقة
            $table->string('attachment')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
