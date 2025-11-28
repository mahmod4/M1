# إصلاح مشكلة Query ID في Xano

## ✅ التحديثات المُنفذة:

### 1. تحديث Query IDs:
```javascript
const XANO_QUERY_IDS = {
    SIGNUP: '3199390', // Query ID للتسجيل
    LOGIN: '3199389',  // Query ID لتسجيل الدخول
};
```

### 2. تحديث Fallback:
- تم تغيير fallback من `3199389` إلى `3199390`

### 3. تحسين رسائل الخطأ:
- رسائل خطأ أوضح عند فشل Query

## 🔍 المشكلة الحالية:

من الـ logs، يبدو أن Query `3199390` يعيد **404**، مما يعني:

### الاحتمالات:
1. ❌ Query ID غير موجود في Xano
2. ❌ Query موجود لكن غير مُعد بشكل صحيح
3. ❌ Query موجود لكن غير منشور (Published)

## 🛠️ كيفية التحقق من Query في Xano:

### الخطوة 1: التحقق من وجود Query
1. افتح Xano Dashboard
2. اذهب إلى **API** → **Queries**
3. ابحث عن Query ID: `3199390`
4. تأكد من وجوده

### الخطوة 2: التحقق من إعدادات Query
1. افتح Query `3199390`
2. تأكد من:
   - ✅ Query منشور (Published)
   - ✅ Method: `POST`
   - ✅ Inputs: `fullName`, `email`, `phone`, `password`, `userType`, `specialty`
   - ✅ Logic: يحفظ البيانات في قاعدة البيانات

### الخطوة 3: اختبار Query مباشرة
1. في Xano Dashboard، افتح Query `3199390`
2. اضغط على **Test**
3. أدخل بيانات تجريبية:
   ```json
   {
       "fullName": "اختبار",
       "email": "test@example.com",
       "phone": "01234567890",
       "password": "password123",
       "userType": "client"
   }
   ```
4. اضغط **Run**
5. تحقق من النتيجة

### الخطوة 4: التحقق من URL
تأكد من أن URL صحيح:
```
https://x8ki-letl-twmt.n7.xano.io/api:320199/query/3199390
```

## 🔧 إذا كان Query غير موجود:

### الحل 1: إنشاء Query جديد
1. في Xano Dashboard، اذهب إلى **API** → **Queries**
2. اضغط **+ New Query**
3. أدخل الاسم: `Signup User`
4. أضف Inputs:
   - `fullName` (Text)
   - `email` (Text)
   - `phone` (Text)
   - `password` (Text)
   - `userType` (Text)
   - `specialty` (Text, Optional)
5. أضف Logic:
   - إنشاء مستخدم جديد في قاعدة البيانات
   - حفظ جميع البيانات
   - إرجاع بيانات المستخدم + token
6. انشر Query (Publish)
7. انسخ Query ID
8. حدث `XANO_QUERY_IDS.SIGNUP` في `api.js`

### الحل 2: استخدام Query موجود
1. ابحث عن Query موجود للتسجيل
2. انسخ Query ID
3. حدث `XANO_QUERY_IDS.SIGNUP` في `api.js`

## 📝 مثال على Query Logic في Xano:

```javascript
// في Xano Query Logic
const user = await xano.db.table('users').create({
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    password: await xano.auth.hash(input.password),
    userType: input.userType,
    specialty: input.specialty || null
});

const token = await xano.auth.generateToken(user.id);

return {
    user: user,
    token: token
};
```

## ✅ بعد إصلاح Query:

1. تأكد من أن Query يعمل في Xano Dashboard
2. جرب إنشاء حساب جديد
3. تحقق من Console - يجب أن ترى:
   ```
   [API] Using Query ID: 3199390
   [Xano Query 3199390] Response status: 200
   ```

## 🚨 ملاحظات مهمة:

- Query ID يجب أن يكون **نص** (string)، ليس رقم
- Query يجب أن يكون **منشور** (Published)
- Query يجب أن يقبل البيانات بنفس الأسماء المرسلة من الفرونت إند

---

**الخطوة التالية**: تحقق من Query `3199390` في Xano Dashboard وتأكد من أنه موجود ويعمل بشكل صحيح! 🔍

