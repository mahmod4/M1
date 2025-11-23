# تسجيل المستخدم في الباك إند - Backend Registration

## ✅ نعم، سيتم تسجيل المستخدم في الباك إند!

الكود يرسل البيانات إلى Xano API، لكن تحتاج إلى التأكد من إعداد Query في Xano بشكل صحيح.

## كيف يعمل التسجيل:

### 1️⃣ في الفرونت إند (Frontend):
```javascript
// في auth.js - عند الضغط على "إنشاء الحساب"
const userData = {
    fullName: "أحمد محمد",
    email: "ahmed@example.com",
    phone: "01234567890",
    password: "password123",
    userType: "craftsman", // أو "client"
    specialty: "carpentry" // فقط للحرفي
};

// إرسال البيانات إلى الباك إند
const response = await window.API.Auth.signup(userData);
```

### 2️⃣ في api.js:
```javascript
// يحاول استخدام Query Endpoint أولاً
if (XANO_QUERY_IDS.SIGNUP) {
    return await XanoQueries.callQuery(XANO_QUERY_IDS.SIGNUP, userData);
}

// أو REST endpoint
return await apiRequest('/auth/signup', { method: 'POST', body: userData });

// أو fallback إلى query 3199389
return await XanoQueries.callQuery('3199389', userData);
```

### 3️⃣ البيانات المرسلة إلى Xano:
```json
POST https://x8ki-letl-twmt.n7.xano.io/api:320199/query/3199389
{
    "fullName": "أحمد محمد",
    "email": "ahmed@example.com",
    "phone": "01234567890",
    "password": "password123",
    "userType": "craftsman",
    "specialty": "carpentry"
}
```

## ⚠️ ما تحتاج إلى فعله في Xano:

### الخطوة 1: إنشاء Query للتسجيل
1. افتح Xano Dashboard
2. اذهب إلى API → Queries
3. أنشئ Query جديد أو استخدم query موجود
4. انسخ Query ID

### الخطوة 2: إعداد Query في Xano
يجب أن يقبل Query البيانات التالية:

**Input Parameters:**
- `fullName` (string)
- `email` (string)
- `phone` (string)
- `password` (string)
- `userType` (string) - "client" أو "craftsman"
- `specialty` (string, optional) - فقط للحرفي

**Query Logic في Xano:**
```javascript
// مثال على Query في Xano
const input = request.body;

// التحقق من البيانات
if (!input.email || !input.password) {
    return { error: "Email and password are required" };
}

// تشفير كلمة المرور (استخدم hash function في Xano)
const hashedPassword = hashPassword(input.password);

// إنشاء المستخدم
const user = {
    name: input.fullName,
    email: input.email,
    phone: input.phone,
    password: hashedPassword,
    user_type: input.userType, // 'client' أو 'craftsman'
    specialty: input.specialty || null,
    created_at: new Date()
};

// حفظ في قاعدة البيانات
const newUser = db.users.create(user);

// إرجاع النتيجة
return {
    success: true,
    user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        userType: newUser.user_type
    },
    token: generateToken(newUser.id) // إذا كنت تستخدم JWT
};
```

### الخطوة 3: تحديث api.js
افتح `api.js` وحدّث Query ID:

```javascript
const XANO_QUERY_IDS = {
    SIGNUP: '3199389', // ✅ ضع Query ID للتسجيل هنا
    LOGIN: '3199390',  // ✅ ضع Query ID لتسجيل الدخول هنا
};
```

## 🔍 للتحقق من أن التسجيل يعمل:

### 1. افتح Developer Console (F12)
### 2. جرب إنشاء حساب
### 3. تحقق من Network Tab:
   - يجب أن ترى request إلى Xano
   - Status يجب أن يكون 200 (نجاح)
   - Response يجب أن يحتوي على بيانات المستخدم

### 4. تحقق من Console:
```
Signup form submitted
Calling signup API...
Signup response: { success: true, user: {...} }
```

### 5. تحقق من Xano Dashboard:
   - اذهب إلى قاعدة البيانات
   - تحقق من وجود المستخدم الجديد في جدول users

## ❌ إذا لم يعمل:

### المشكلة 1: 404 Error
**السبب**: Query ID غير صحيح
**الحل**: 
- تحقق من Query ID في Xano Dashboard
- حدّث `XANO_QUERY_IDS.SIGNUP` في `api.js`

### المشكلة 2: 400/500 Error
**السبب**: Query لا يقبل البيانات أو يوجد خطأ في Query
**الحل**:
- تحقق من Input Parameters في Query
- تحقق من Query Logic في Xano
- تأكد من أن Query يحفظ البيانات في قاعدة البيانات

### المشكلة 3: CORS Error
**السبب**: CORS غير مفعّل في Xano
**الحل**:
- في Xano Dashboard → API Settings
- فعّل CORS
- أضف نطاق الموقع إلى Allowed Origins

## 📝 مثال كامل على Query في Xano:

```javascript
// في Xano Query Editor
const input = request.body;

// Validation
if (!input.email || !input.password || !input.fullName) {
    return { 
        success: false, 
        error: "Missing required fields" 
    };
}

// Check if user exists
const existingUser = db.users.filter({ email: input.email });
if (existingUser.length > 0) {
    return { 
        success: false, 
        error: "Email already exists" 
    };
}

// Hash password (use Xano's hash function)
const hashedPassword = hash(input.password);

// Create user
const newUser = db.users.create({
    name: input.fullName,
    email: input.email,
    phone: input.phone || null,
    password: hashedPassword,
    user_type: input.userType || 'client',
    specialty: input.specialty || null,
    created_at: new Date(),
    updated_at: new Date()
});

// Generate token (if using JWT)
const token = generateJWT({
    userId: newUser.id,
    email: newUser.email
});

// Return response
return {
    success: true,
    data: {
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            userType: newUser.user_type
        },
        token: token
    }
};
```

## ✅ الخلاصة:

**نعم، سيتم تسجيل المستخدم في الباك إند** إذا:
1. ✅ Query ID صحيح في `api.js`
2. ✅ Query في Xano يقبل البيانات
3. ✅ Query يحفظ البيانات في قاعدة البيانات
4. ✅ CORS مفعّل في Xano

**الخطوة التالية**: حدّث `XANO_QUERY_IDS.SIGNUP` في `api.js` بـ Query ID الصحيح من Xano! 🚀

