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
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->onDelete('cascade');
            $table->string('unit_number');
            $table->integer('floor_number');
            $table->decimal('area', 10, 2); // المساحة بالمتر المربع
            $table->integer('rooms_count')->default(1);
            $table->integer('bathrooms_count')->default(1);
            $table->enum('status', ['متاح', 'مؤجر', 'محجوز', 'صيانة'])->default('متاح');
            $table->decimal('monthly_rent', 12, 2);
            $table->decimal('deposit_amount', 12, 2)->default(0);
            $table->text('description')->nullable();
            $table->json('features')->nullable(); // مميزات إضافية
            $table->boolean('is_furnished')->default(false);
            $table->boolean('has_kitchen')->default(true);
            $table->boolean('has_balcony')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
