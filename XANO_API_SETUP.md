# إعداد Xano API

## معلومات API

**Base URL:** `https://x8ki-letl-twmt.n7.xano.io/api:XDzfWuf5`

**Query Endpoints:**
- Query 3199391: `https://x8ki-letl-twmt.n7.xano.io/api:320199/query/3199391`
- Query 3199390: `https://x8ki-letl-twmt.n7.xano.io/api:320199/query/3199390`
- Query 3199389: `https://x8ki-letl-twmt.n7.xano.io/api:320199/query/3199389`

## بنية Endpoints في Xano

في Xano، عادة ما تكون البنية كالتالي:
- Base URL: `https://x8ki-letl-twmt.n7.xano.io/api:XDzfWuf5`
- Endpoints: `/auth/login`, `/auth/signup`, `/craftsmen`, إلخ

## تحديث Endpoints في api.js

إذا كانت Endpoints في Xano مختلفة، قم بتحديثها في ملف `api.js`:

### مثال على Authentication Endpoints:

```javascript
// إذا كان endpoint تسجيل الدخول هو:
// https://x8ki-letl-twmt.n7.xano.io/api:XDzfWuf5/auth/login
AuthAPI.login = async (email, password) => {
    return await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password }
    });
};

// أو إذا كان مختلفاً، مثلاً:
// https://x8ki-letl-twmt.n7.xano.io/api:XDzfWuf5/v1/user/login
AuthAPI.login = async (email, password) => {
    return await apiRequest('/v1/user/login', {
        method: 'POST',
        body: { email, password }
    });
};
```

## اختبار API

يمكنك اختبار API باستخدام:

1. **Postman** أو **Thunder Client**
2. **Browser Console**:
```javascript
// اختبار Base URL
fetch('https://x8ki-letl-twmt.n7.xano.io/api:XDzfWuf5/health')
    .then(res => res.json())
    .then(data => console.log(data));
```

## ملاحظات مهمة

1. **CORS**: تأكد من تفعيل CORS في Xano للسماح للموقع بالوصول
2. **Authentication**: تحقق من طريقة المصادقة المستخدمة (Bearer Token, API Key, etc.)
3. **Response Format**: تأكد من شكل الرد من Xano (قد يكون مختلفاً)

## مثال على Response من Xano

عادة ما يكون Response من Xano بهذا الشكل:
```json
{
    "success": true,
    "data": { ... },
    "message": "..."
}
```

أو:
```json
{
    "id": "...",
    "name": "...",
    ...
}
```

قم بتحديث `apiRequest` في `api.js` إذا كان شكل الرد مختلفاً.

## استخدام Query Endpoints المحددة

تم إضافة دالة `XanoQueries` في `api.js` للتعامل مع Query Endpoints المحددة:

### استخدام Query 3199391:
```javascript
// في أي ملف JavaScript
const result = await window.API.XanoQueries.query3199391({
    // parameters here
});
```

### استخدام Query 3199390:
```javascript
const result = await window.API.XanoQueries.query3199390({
    // parameters here
});
```

### استخدام Query عام:
```javascript
// يمكنك استدعاء أي query باستخدام ID
const result = await window.API.XanoQueries.callQuery('3199391', {
    // parameters here
});
```

### مثال عملي:
```javascript
// في صفحة craftsmen.js
async function loadCraftsmen() {
    try {
        const craftsmen = await window.API.XanoQueries.query3199391({
            specialty: 'carpentry',
            city: 'cairo'
        });
        displayCraftsmen(craftsmen);
    } catch (error) {
        console.error('Error:', error);
    }
}
```


