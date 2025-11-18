# Panduan Keamanan untuk Developer

## 🔒 Security Implementation Guide

### 1. Cara Menggunakan Security Functions

#### Import Security Functions

```typescript
import { sanitizeInput, isValidUrl, validateBlogTitle, validateImageUpload } from "@/lib/security";
import { validateBlogContent } from "@/lib/validation";
```

#### Validasi Input Sebelum Submit

```typescript
const handleSubmit = async () => {
  // Validasi title
  const titleValidation = validateBlogTitle(title);
  if (!titleValidation.valid) {
    toast.error(titleValidation.error);
    return;
  }

  // Validasi content
  const contentValidation = validateBlogContent(content);
  if (!contentValidation.valid) {
    toast.error(contentValidation.error);
    return;
  }

  // Lanjutkan submit...
};
```

#### Validasi File Upload

```typescript
const handleImageUpload = (file: File) => {
  const validation = validateImageUpload(file);
  if (!validation.valid) {
    toast.error(validation.error);
    return;
  }

  // Upload file...
};
```

### 2. Setup Environment Variables

**Development (.env.local):**

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_dev_domain
# ... dst
```

**Production (Vercel/Netlify):**
Tambahkan di dashboard hosting provider.

### 3. Testing Security

```bash
# Test XSS protection
# Coba input: <script>alert('xss')</script>
# Harus di-sanitize

# Test file upload
# Upload file > 1MB -> harus ditolak
# Upload non-image -> harus ditolak

# Test rate limiting
# Hit API 30+ kali dalam 1 menit -> harus 429

# Test unauthorized access
# Coba edit blog orang lain tanpa login -> harus ditolak
```

### 4. Code Review Checklist

Sebelum commit code, pastikan:

- [ ] Semua user input di-sanitize
- [ ] Semua URL di-validate
- [ ] File upload di-validate (type & size)
- [ ] Authorization check untuk write operations
- [ ] Error messages tidak expose sensitive info
- [ ] No console.log di production
- [ ] No hardcoded credentials
- [ ] HTTPS URLs only

### 5. Common Security Mistakes

❌ **JANGAN:**

```typescript
// Langsung save user input
await addDoc(collection(db, "blogs"), {
  title: userInput, // BAHAYA!
});

// Tidak validasi file
const uploadImage = (file: any) => {
  cloudinary.upload(file); // BAHAYA!
};
```

✅ **LAKUKAN:**

```typescript
// Sanitize & validate dulu
const titleValidation = validateBlogTitle(userInput);
if (!titleValidation.valid) return;

await addDoc(collection(db, "blogs"), {
  title: sanitizeInput(userInput), // AMAN
});

// Validasi file
const validation = validateImageUpload(file);
if (!validation.valid) return;
cloudinary.upload(file); // AMAN
```

### 6. Emergency Response

Jika menemukan vulnerability:

1. **STOP** - Jangan panic
2. **ASSESS** - Evaluasi severity
3. **PATCH** - Fix vulnerability immediately
4. **DEPLOY** - Deploy fix ke production ASAP
5. **NOTIFY** - Inform team & affected users
6. **DOCUMENT** - Catat incident & lesson learned

### 7. Regular Maintenance

**Weekly:**

- Review new user reports
- Check error logs

**Monthly:**

- `npm audit fix`
- Review Firebase usage
- Update dependencies

**Quarterly:**

- Security audit
- Review & update security rules
- Penetration testing (jika budget ada)

---

**Questions?** Contact security team or refer to SECURITY.md
