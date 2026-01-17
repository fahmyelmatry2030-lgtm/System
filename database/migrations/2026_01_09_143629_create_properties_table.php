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
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('address');
            $table->enum('type', ['شقة', 'فيلا', 'عمارة', 'محل تجاري', 'أرض']);
            $table->integer('floors_count')->default(1);
            $table->integer('units_count')->default(1);
            $table->string('city');
            $table->string('district');
            $table->text('description')->nullable();
            $table->boolean('has_elevator')->default(false);
            $table->boolean('has_parking')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
