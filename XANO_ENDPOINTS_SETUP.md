# إعداد Xano Endpoints

## المشكلة الحالية

الـ endpoint `/auth/signup` يعطي خطأ 404 لأن Xano يستخدم Query Endpoints بدلاً من REST endpoints العادية.

## الحل

تم تحديث `api.js` لدعم كلا الطريقتين:
1. Query Endpoints (المفضلة في Xano)
2. REST Endpoints (fallback)

## كيفية الإعداد

### الخطوة 1: العثور على Query IDs في Xano

1. افتح Xano Dashboard
2. اذهب إلى API section
3. ابحث عن Queries للتسجيل وتسجيل الدخول
4. انسخ Query ID لكل endpoint

### الخطوة 2: تحديث api.js

افتح `api.js` وابحث عن:

```javascript
const XANO_QUERY_IDS = {
    SIGNUP: null, // قم بتحديثه بـ Query ID للتسجيل
    LOGIN: null,  // قم بتحديثه بـ Query ID لتسجيل الدخول
};
```

قم بتحديث القيم:

```javascript
const XANO_QUERY_IDS = {
    SIGNUP: '3199389', // مثال: Query ID للتسجيل
    LOGIN: '3199390',  // مثال: Query ID لتسجيل الدخول
};
```

### الخطوة 3: اختبار

بعد التحديث، جرب:
1. إنشاء حساب جديد
2. تسجيل الدخول

## إذا لم تعرف Query IDs

يمكنك:
1. استخدام Query IDs الموجودة (3199389, 3199390, 3199391)
2. أو إنشاء Queries جديدة في Xano Dashboard

## مثال على Query في Xano

عادة ما يكون Query في Xano بهذا الشكل:
- **Input**: `{ email, password, fullName, ... }`
- **Output**: `{ token, user, ... }`

تأكد من أن Query في Xano يقبل نفس المعاملات التي ترسلها من الفرونت إند.

## ملاحظات مهمة

1. **CORS**: تأكد من تفعيل CORS في Xano
2. **Authentication**: تأكد من أن Query يعيد token في الرد
3. **Response Format**: قد يكون شكل الرد مختلفاً، الكود يتعامل مع ذلك تلقائياً

---

**بعد التحديث، يجب أن يعمل التسجيل وتسجيل الدخول بشكل صحيح!** ✅

