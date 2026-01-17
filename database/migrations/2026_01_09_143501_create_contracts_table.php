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
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->string('contract_number')->unique();
            $table->foreignId('client_id')->constrained()->onDelete('restrict');
            $table->foreignId('unit_id')->constrained()->onDelete('restrict');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('monthly_rent', 12, 2);
            $table->decimal('deposit_amount', 12, 2);
            
            // تفاصيل العقد
            $table->enum('payment_day', range(1, 28))->default(1);
            $table->enum('contract_type', ['سكني', 'تجاري', 'إداري']);
            $table->enum('payment_method', ['تحويل بنكي', 'شيك', 'نقدي']);
            
            // معلومات إضافية
            $table->text('notes')->nullable();
            $table->json('terms')->nullable(); // شروط العقد
            
            // حالة العقد
            $table->enum('status', ['نشط', 'منتهي', 'ملغي'])->default('نشط');
            $table->date('cancellation_date')->nullable();
            $table->text('cancellation_reason')->nullable();
            
            // توقيعات
            $table->string('landlord_signature')->nullable();
            $table->string('tenant_signature')->nullable();
            $table->string('witness_name')->nullable();
            $table->string('witness_phone')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
