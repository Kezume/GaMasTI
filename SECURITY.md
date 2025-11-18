# Security Best Practices - GaMasTI

## 🔐 Langkah-langkah Setup Keamanan

### 1. Environment Variables

**PENTING:** Sebelum deploy ke production, pastikan setup environment variables:

1. Copy file `.env.local.example` menjadi `.env.local`:

   ```bash
   cp .env.local.example .env.local
   ```

2. Isi semua nilai dengan credentials yang benar:

   - Firebase credentials
   - Cloudinary credentials
   - Application URL

3. **JANGAN PERNAH** commit file `.env.local` atau `.env` ke Git!

### 2. Firebase Security Rules

Update Firestore Security Rules di Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection
    match /users/{userId} {
      // User bisa read semua user data
      allow read: if request.auth != null;

      // User hanya bisa update data sendiri, atau admin bisa update semua
      allow write: if request.auth != null &&
        (request.auth.uid == userId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Blogs collection
    match /blogs/{blogId} {
      // Semua orang bisa read blog yang published
      allow read: if resource.data.status == 'published' ||
        request.auth != null;

      // Hanya author atau admin yang bisa update/delete
      allow update, delete: if request.auth != null &&
        (resource.data.authorId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');

      // User yang authenticated bisa create blog
      allow create: if request.auth != null &&
        request.resource.data.authorId == request.auth.uid &&
        request.resource.data.title is string &&
        request.resource.data.title.size() > 0 &&
        request.resource.data.title.size() <= 200 &&
        request.resource.data.content is string &&
        request.resource.data.content.size() <= 50000;
    }
  }
}
```

### 3. Firebase Storage Rules

Update Storage Rules di Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /blog-images/{allPaths=**} {
      // Hanya user yang authenticated bisa upload
      allow read: if true;
      allow write: if request.auth != null &&
        // Validasi tipe file
        request.resource.contentType.matches('image/.*') &&
        // Max size 1MB
        request.resource.size < 1 * 1024 * 1024;
    }

    match /blog-files/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
        // Max size 5MB untuk file
        request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

### 4. Cloudinary Setup (Jika digunakan)

1. Login ke Cloudinary Dashboard
2. Buat Upload Preset dengan settings:

   - **Mode:** Unsigned (untuk client-side upload)
   - **Folder:** `gamasti` (atau nama folder pilihan)
   - **Resource Type:** Image only
   - **Max file size:** 1MB
   - **Allowed formats:** jpg, png, gif, webp

3. Copy nama preset dan cloud name ke `.env.local`

### 5. Security Checklist

#### ✅ Sudah Diimplementasikan:

- [x] Environment variables untuk sensitive data
- [x] Security headers (CSP, X-Frame-Options, HSTS, dll)
- [x] Rate limiting di middleware
- [x] Input sanitization functions
- [x] XSS prevention
- [x] File type & size validation
- [x] URL validation
- [x] Role-based access control (RBAC)
- [x] Malicious content detection
- [x] HTTPS enforcement (via headers)

#### 📋 Yang Perlu Dilakukan Manual:

- [ ] Setup Firebase Security Rules (lihat section 2)
- [ ] Setup Firebase Storage Rules (lihat section 3)
- [ ] Setup environment variables untuk production
- [ ] Enable Firebase App Check (recommended)
- [ ] Setup monitoring & logging
- [ ] Regular security audits
- [ ] Keep dependencies updated

### 6. Deployment Security

**Vercel/Netlify:**

1. Tambahkan environment variables di dashboard
2. Enable automatic HTTPS
3. Setup custom domain dengan SSL

**Firebase Hosting:**

```bash
firebase deploy --only hosting
```

### 7. Monitoring & Alerts

**Setup Firebase App Check:**

```bash
npm install firebase-app-check
```

Di `lib/firebase.ts` tambahkan:

```typescript
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Setelah initializeApp
if (typeof window !== "undefined") {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider("YOUR_RECAPTCHA_SITE_KEY"),
    isTokenAutoRefreshEnabled: true,
  });
}
```

### 8. Regular Maintenance

- Update dependencies setiap bulan: `npm audit fix`
- Monitor Firebase usage & quotas
- Review security rules setiap 3 bulan
- Check untuk CVE di dependencies: `npm audit`
- Backup database secara regular

### 9. Incident Response

Jika terjadi security breach:

1. Revoke semua Firebase API keys
2. Generate new credentials
3. Force logout semua users
4. Review logs untuk identify attack vector
5. Update security measures
6. Notify affected users

### 10. Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Documentation](https://firebase.google.com/docs/rules)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Web Security Checklist](https://github.com/OWASP/CheatSheetSeries)

---

## 🚨 PENTING

1. **JANGAN** hardcode credentials di kode
2. **JANGAN** commit file `.env*` ke Git
3. **JANGAN** disable security headers di production
4. **SELALU** validate & sanitize user input
5. **SELALU** use HTTPS di production
6. **GUNAKAN** Firebase Security Rules yang ketat
7. **MONITOR** aplikasi untuk aktivitas mencurigakan
8. **UPDATE** dependencies secara regular

---

**Last Updated:** November 18, 2025
