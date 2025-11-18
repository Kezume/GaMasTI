# 🔐 Quick Security Setup Guide

## Setup Cepat (5 Menit)

### 1. Environment Variables

Copy dan isi environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` dan isi dengan credentials yang benar:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain_here
# ... dst
```

### 2. Install Dependencies

Jika ada dependency baru:

```bash
npm install
# atau
bun install
```

### 3. Test Development

```bash
npm run dev
# atau
bun run dev
```

### 4. Test Security Features

#### Test XSS Protection:

1. Buka create blog
2. Coba input: `<script>alert('test')</script>` di title
3. Harus di-sanitize menjadi text biasa

#### Test File Upload:

1. Upload file > 1MB → harus ditolak
2. Upload file non-image → harus ditolak
3. Upload file .jpg < 1MB → harus berhasil

#### Test Rate Limiting:

1. Buka Network tab di DevTools
2. Hit API endpoint 30+ kali cepat
3. Harus dapat 429 error setelah 30 requests

#### Test Authorization:

1. Login sebagai user A
2. Coba edit blog milik user B
3. Tombol edit tidak muncul (atau denied)

---

## 🔥 Firebase Security Rules Setup

### Firestore Rules

Login ke [Firebase Console](https://console.firebase.google.com) → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function
    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if isOwner(userId) || isAdmin();
    }

    // Blogs collection
    match /blogs/{blogId} {
      allow read: if resource.data.status == 'published' ||
                     request.auth != null;

      allow create: if request.auth != null &&
        request.resource.data.authorId == request.auth.uid &&
        request.resource.data.title is string &&
        request.resource.data.title.size() > 0 &&
        request.resource.data.title.size() <= 200;

      allow update, delete: if isOwner(resource.data.authorId) || isAdmin();
    }
  }
}
```

### Storage Rules

Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /blog-images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.resource.contentType.matches('image/.*') &&
        request.resource.size < 1 * 1024 * 1024; // 1MB
    }
  }
}
```

---

## 🚀 Production Deployment

### Vercel

1. Push ke GitHub
2. Import project di Vercel
3. Tambahkan environment variables di Settings → Environment Variables
4. Deploy!

### Netlify

1. Push ke GitHub
2. Import project di Netlify
3. Tambahkan environment variables di Site settings → Environment variables
4. Deploy!

---

## 📊 Security Checklist

### Pre-Deploy:

- [x] Environment variables configured
- [x] Security headers enabled
- [x] Rate limiting active
- [x] Input validation implemented
- [x] XSS protection active
- [ ] Firebase rules updated
- [ ] Storage rules updated
- [ ] Testing completed

### Post-Deploy:

- [ ] HTTPS working
- [ ] Custom domain configured
- [ ] Error monitoring setup
- [ ] Firebase App Check enabled
- [ ] Regular backups scheduled

---

## 🐛 Troubleshooting

### "Firebase not defined"

→ Check `.env.local` sudah ada dan configured

### "Rate limit exceeded"

→ Normal! Tunggu 1 menit atau clear rate limit

### "Unauthorized"

→ Check Firebase rules sudah updated

### CSP errors di console

→ Normal untuk development, akan aman di production

---

## 📞 Help

- **Security Issues:** Lihat `SECURITY.md`
- **Implementation Guide:** Lihat `docs/SECURITY_GUIDE.md`
- **Full Documentation:** Lihat `SECURITY_IMPLEMENTATION.md`

---

**Ready?** Run `npm run dev` dan mulai testing! 🎉
