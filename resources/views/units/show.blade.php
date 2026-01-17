@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0">تفاصيل الوحدة</h4>
    <div class="d-flex gap-2">
        <a href="{{ route('units.edit', $unit) }}" class="btn btn-secondary">تعديل</a>
        <a href="{{ route('units.index') }}" class="btn btn-outline-secondary">رجوع</a>
    </div>
</div>

<div class="card mb-3">
    <div class="card-body">
        <div class="row">
            <div class="col-md-6"><strong>العقار:</strong> {{ $unit->property?->name }}</div>
            <div class="col-md-6"><strong>رقم الوحدة:</strong> {{ $unit->unit_number }}</div>
            <div class="col-md-4"><strong>الدور:</strong> {{ $unit->floor_number }}</div>
            <div class="col-md-4"><strong>الحالة:</strong> {{ $unit->status }}</div>
            <div class="col-md-4"><strong>الإيجار:</strong> {{ $unit->monthly_rent }}</div>
            <div class="col-md-4"><strong>التأمين:</strong> {{ $unit->deposit_amount }}</div>
            <div class="col-md-4"><strong>الغرف:</strong> {{ $unit->rooms_count }}</div>
            <div class="col-md-4"><strong>الحمامات:</strong> {{ $unit->bathrooms_count }}</div>
            <div class="col-md-12"><strong>الوصف:</strong> {{ $unit->description }}</div>
        </div>
    </div>
</div>

@if($activeContract)
    <div class="alert alert-info">
        <strong>عقد نشط:</strong> {{ $activeContract->contract_number }} - العميل: {{ $activeContract->client?->name }}
    </div>
@endif

@if(isset($contracts))
<div class="card">
    <div class="card-header">العقود</div>
    <div class="card-body table-responsive">
        <table class="table table-bordered mb-0">
            <thead>
            <tr>
                <th>رقم العقد</th>
                <th>العميل</th>
                <th>الحالة</th>
                <th>من</th>
                <th>إلى</th>
            </tr>
            </thead>
            <tbody>
            @foreach($contracts as $c)
                <tr>
                    <td><a href="{{ route('contracts.show', $c) }}">{{ $c->contract_number }}</a></td>
                    <td>{{ $c->client?->name }}</td>
                    <td>{{ $c->status }}</td>
                    <td>{{ $c->start_date }}</td>
                    <td>{{ $c->end_date }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
</div>
@endif
@endsection
