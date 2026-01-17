@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0">تفاصيل العميل</h4>
    <div class="d-flex gap-2">
        <a href="{{ route('clients.edit', $client) }}" class="btn btn-secondary">تعديل</a>
        <a href="{{ route('clients.index') }}" class="btn btn-outline-secondary">رجوع</a>
    </div>
</div>

<div class="card">
    <div class="card-body">
        <div class="row">
            <div class="col-md-6"><strong>الاسم:</strong> {{ $client->name }}</div>
            <div class="col-md-6"><strong>النوع:</strong> {{ $client->client_type }}</div>
            <div class="col-md-6"><strong>الموبايل:</strong> {{ $client->phone }}</div>
            <div class="col-md-6"><strong>البريد:</strong> {{ $client->email }}</div>
            <div class="col-md-6"><strong>الرقم القومي:</strong> {{ $client->national_id }}</div>
            <div class="col-md-12"><strong>العنوان:</strong> {{ $client->address }}</div>
            <div class="col-md-12"><strong>ملاحظات:</strong> {{ $client->notes }}</div>
        </div>
    </div>
</div>
@endsection
