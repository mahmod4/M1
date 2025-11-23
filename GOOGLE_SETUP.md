# إعداد تسجيل الدخول عبر Google

## الخطوات المطلوبة:

### 1. إنشاء مشروع في Google Cloud Console

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد أو اختر مشروع موجود
3. اذهب إلى **APIs & Services** > **Credentials**

### 2. إنشاء OAuth 2.0 Client ID

1. اضغط على **Create Credentials** > **OAuth client ID**
2. إذا طُلب منك، قم بإعداد OAuth consent screen أولاً
3. اختر **Web application** كنوع التطبيق
4. أضف **Authorized JavaScript origins**:
   - `http://localhost` (للتطوير المحلي)
   - `https://yourdomain.com` (للموقع النهائي)
5. أضف **Authorized redirect URIs**:
   - `http://localhost` (للتطوير المحلي)
   - `https://yourdomain.com` (للموقع النهائي)

### 3. الحصول على Client ID

بعد إنشاء OAuth client، ستحصل على **Client ID** (يبدو كالتالي: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

### 4. تحديث الملفات

استبدل `YOUR_GOOGLE_CLIENT_ID` في الملفات التالية بـ Client ID الخاص بك:

- `login.html` (السطر 32)
- `signup.html` (السطر 60)

مثال:
```html
data-client_id="123456789-abcdefghijklmnop.apps.googleusercontent.com"
```

### 5. اختبار

1. افتح `login.html` أو `signup.html` في المتصفح
2. اضغط على زر "Sign in with Google"
3. اختر حساب Google الخاص بك
4. يجب أن يتم تسجيل الدخول بنجاح

## ملاحظات مهمة:

- في بيئة الإنتاج، يجب إضافة Client ID الخاص بك
- تأكد من إضافة جميع النطاقات المطلوبة في Google Cloud Console
- البيانات حالياً تُحفظ في localStorage (للتطوير فقط)
- في الإنتاج، يجب إرسال البيانات إلى خادمك للتحقق منها وحفظها

