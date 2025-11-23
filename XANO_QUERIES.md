# دليل استخدام Xano Query Endpoints

## Query Endpoints المتاحة

### Query 3199391
**URL:** `https://x8ki-letl-twmt.n7.xano.io/api:320199/query/3199391`

**الاستخدام:**
```javascript
const result = await window.API.XanoQueries.query3199391({
    // أضف المعاملات المطلوبة هنا
    // مثال:
    // specialty: 'carpentry',
    // city: 'cairo'
});
```

### Query 3199390
**URL:** `https://x8ki-letl-twmt.n7.xano.io/api:320199/query/3199390`

**الاستخدام:**
```javascript
const result = await window.API.XanoQueries.query3199390({
    // أضف المعاملات المطلوبة هنا
});
```

## استخدام عام لأي Query

إذا كان لديك query ID آخر، يمكنك استخدام:

```javascript
const result = await window.API.XanoQueries.callQuery('QUERY_ID', {
    // parameters
});
```

## أمثلة عملية

### مثال 1: جلب الحرفيين
```javascript
async function loadCraftsmen() {
    try {
        const craftsmen = await window.API.XanoQueries.query3199391({
            specialty: 'carpentry',
            city: 'cairo',
            minRating: 4
        });
        console.log('Craftsmen:', craftsmen);
    } catch (error) {
        console.error('Error loading craftsmen:', error);
    }
}
```

### مثال 2: البحث
```javascript
async function searchCraftsmen(query) {
    try {
        const results = await window.API.XanoQueries.query3199390({
            search: query,
            limit: 20
        });
        return results;
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}
```

## ملاحظات مهمة

1. **المعاملات**: تحقق من المعاملات المطلوبة لكل query في Xano Dashboard
2. **المصادقة**: يتم إرسال التوكن تلقائياً إذا كان المستخدم مسجل دخول
3. **تنظيف البيانات**: جميع البيانات تُنظف تلقائياً من XSS قبل الإرسال
4. **معالجة الأخطاء**: يتم التعامل مع أخطاء 401 و 403 تلقائياً

## إضافة Query جديد

لإضافة query جديد، أضف دالة في `api.js`:

```javascript
// في XanoQueries object
queryYOUR_ID: async (params = {}) => {
    const queryId = 'YOUR_ID';
    const fullUrl = `https://x8ki-letl-twmt.n7.xano.io/api:320199/query/${queryId}`;
    
    const token = TokenManager.getToken();
    const config = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(sanitizeRequestBody(params)),
        credentials: 'same-origin'
    };
    
    try {
        const response = await fetch(fullUrl, config);
        
        if (response.status === 401) {
            TokenManager.removeToken();
            throw new Error('انتهت صلاحية الجلسة');
        }
        
        const data = await response.json();
        return data.data || data;
    } catch (error) {
        console.error(`Xano Query ${queryId} Error:`, error);
        throw error;
    }
}
```

---

تم التحديث: جميع Query Endpoints جاهزة للاستخدام! 🚀

