# نظام إدارة العقارات (Laravel)

نظام بسيط لإدارة:

- العملاء
- العقارات
- الوحدات
- العقود
- المدفوعات (مع مرفقات)

## المتطلبات

- PHP 8+
- Composer
- SQLite (ملف قاعدة البيانات)

## إعداد وتشغيل المشروع (أول مرة)

1) تثبيت الاعتمادات:

```bash
composer install
```

2) إنشاء ملف البيئة:

```bash
copy .env.example .env
php artisan key:generate
```

3) إعداد قاعدة البيانات (SQLite):

- تأكد أن الملف موجود:

`database/database.sqlite`

- شغّل المايجريشن:

```bash
php artisan migrate
```

4) إنشاء مستخدم Admin افتراضي:

```bash
php artisan db:seed
```

### بيانات الدخول الافتراضية

- Email: `admin@example.com`
- Password: `Admin@12345`

مهم: بعد التسليم يفضّل تغيير البيانات من داخل قاعدة البيانات أو إنشاء مستخدم جديد.

5) تفعيل عرض المرفقات (payments attachments):

```bash
php artisan storage:link
```

6) تشغيل السيرفر:

```bash
php artisan serve
```

ثم افتح:

- `http://127.0.0.1:8000/login`

## روابط النظام

- Login: `/login`
- Dashboard: `/dashboard`
- Clients: `/clients`
- Properties: `/properties`
- Units: `/units`
- Contracts: `/contracts`
- Payments: `/payments`

## ملاحظات مهمة للتسليم

- المشروع يستخدم Middleware `auth` لحماية الروتس الأساسية.
- تم تفعيل `storage:link` لعرض المرفقات.
