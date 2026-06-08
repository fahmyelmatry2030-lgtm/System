الملف يوضّح تنظيف المشروع الذي قمت به

ما نُفّذ:
- أنشأت نسخ احتياطية: `database.sqlite.bak`, `database.db.bak`.
- حذفت ملفات مؤقتة لبنًاء/قاعدة البيانات: `database.sqlite-shm`, `database.sqlite-wal`, `database.db-shm`, `database.db-wal`.
- حذفت مجلدات البناء المؤقتة: `.next/`, `.vercel/`.
- حذفت `node_modules/` لإفراغ مساحة.

ما بقى (لم يُحذف):
- قواعد البيانات الفعلية: `database.sqlite`, `database.db`.
- `package-lock.json`, `package.json`, ومجلد `src/` و`public/`.

كيفية الاسترجاع/تشغيل المشروع مجدداً:
1. استعادة النسخ الاحتياطية (إن لزم):
   - انسخ `database.sqlite.bak` إلى `database.sqlite` أو `database.db.bak` إلى `database.db`.
2. إعادة تثبيت الحزم:
```bash
npm install
```
3. إعادة بناء المشروع:
```bash
npm run build
```

ملاحظات أمان:
- لا تُحذف `database.sqlite` أو `database.db` دون التأكد من وجود نسخ احتياطية خارج المستودع.
- إن رغبت، أستطيع حذف `package-lock.json` أيضاً أو إعادة تثبيت الحزم الآن.
