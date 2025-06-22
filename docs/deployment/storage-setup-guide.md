# 📁 Neuronize Storage Setup Guide

Complete guide for setting up Supabase Storage for the Neuronize tax practice management system.

## 🎯 Overview

Neuronize uses **10 specialized storage buckets** to handle different types of files across the entire system:

### **📋 Storage Buckets**

| Bucket | Purpose | Public | Size Limit | Used By |
|--------|---------|--------|------------|---------|
| `documents` | Main document storage | ❌ | 50MB | Document management, client files |
| `message-attachments` | Message file attachments | ❌ | 10MB | Messaging system |
| `profile-images` | User profile pictures | ✅ | 2MB | User profiles, avatars |
| `tax-documents` | Tax-specific documents | ❌ | 50MB | Tax forms, W2s, 1099s |
| `client-files` | General client uploads | ❌ | 50MB | Client document portal |
| `processed-documents` | AI-processed documents | ❌ | 50MB | Document processing pipeline |
| `document-thumbnails` | Document preview images | ✅ | 1MB | Document previews |
| `report-exports` | Generated reports | ❌ | 20MB | Report generation |
| `temp-files` | Temporary processing files | ❌ | 100MB | AI processing, uploads |
| `company-logos` | Company logo images | ✅ | 2MB | Branding, client portals |

---

## 🚀 Quick Setup

### **1. Automated Setup (Recommended)**

```bash
# Install dependencies
npm install

# Run the automated setup script
node scripts/setup-storage.js
```

### **2. Manual Setup**

If you prefer manual setup:

1. **Copy the SQL script** from `docs/database/storage-setup.sql`
2. **Open Supabase Dashboard** → SQL Editor
3. **Paste and execute** the SQL script
4. **Verify setup** with: `node scripts/verify-storage.js`

---

## 🔒 Security Features

### **Row Level Security (RLS)**

All buckets have comprehensive RLS policies:

- **User Isolation**: Users can only access their own files
- **Admin Access**: Admins can access all files for management
- **Client Protection**: Clients can only see files they own
- **Conversation Security**: Message attachments respect conversation permissions

### **File Type Restrictions**

Each bucket only accepts specific file types:

- **Documents**: PDF, Word, Excel, images
- **Images**: JPEG, PNG, GIF, WebP
- **Tax Documents**: PDF, Word, Excel, TIFF
- **Messages**: General files with size limits

### **Size Limits**

- **Profile Images**: 2MB max
- **Message Attachments**: 10MB max
- **Documents**: 50MB max
- **Temporary Files**: 100MB max

---

## 🧹 Maintenance

### **Automated Cleanup**

The system includes cleanup functions:

```sql
-- Clean up old temporary files (run daily)
SELECT cleanup_temp_files();

-- Remove orphaned thumbnails
SELECT cleanup_orphaned_thumbnails();

-- Check storage usage
SELECT * FROM get_storage_usage();
```

### **Recommended Cron Jobs**

```bash
# Daily cleanup at 2 AM
0 2 * * * psql -c "SELECT cleanup_temp_files();"

# Weekly thumbnail cleanup
0 3 * * 0 psql -c "SELECT cleanup_orphaned_thumbnails();"
```

---

## 📊 Monitoring

### **Storage Usage Report**

```javascript
// Get current storage usage
const { data } = await supabase.rpc('get_storage_usage')
console.table(data)
```

### **Health Checks**

```bash
# Verify all buckets and policies
node scripts/verify-storage.js

# Test upload/download functionality
node scripts/test-storage.js
```

---

## 🔧 Configuration

### **Environment Variables**

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **File Upload Service**

The system uses a centralized file upload service:

```typescript
import { fileUploadService } from '@/lib/services/fileUpload'

// Upload to specific bucket
const result = await fileUploadService.uploadFile(
  file,
  'documents', // bucket
  'client-files', // folder
  onProgress
)
```

---

## 🎯 Usage Examples

### **Document Upload**

```typescript
// Upload client document
const result = await fileStorageService.uploadFile(file, {
  clientId: 'client-uuid',
  category: 'tax_documents',
  isPublic: false
})
```

### **Message Attachment**

```typescript
// Upload message attachment
const result = await fileUploadService.uploadFile(
  file,
  'message-attachments',
  'messages'
)
```

### **Profile Image**

```typescript
// Upload profile image
const result = await fileUploadService.uploadFile(
  file,
  'profile-images',
  'avatars'
)
```

---

## 🚨 Troubleshooting

### **Common Issues**

**❌ "Bucket not found"**
- Run setup script: `node scripts/setup-storage.js`
- Check Supabase dashboard for bucket existence

**❌ "Permission denied"**
- Verify RLS policies are applied
- Check user authentication
- Ensure proper file ownership

**❌ "File too large"**
- Check bucket size limits
- Compress files if needed
- Use appropriate bucket for file type

**❌ "Invalid file type"**
- Check allowed MIME types for bucket
- Verify file extension
- Use correct bucket for file type

### **Debug Commands**

```bash
# Check bucket configuration
node scripts/verify-storage.js

# Test file upload
node scripts/test-upload.js

# View storage usage
node scripts/storage-usage.js
```

---

## 📈 Performance Optimization

### **CDN Setup (Optional)**

For better performance, consider setting up a CDN:

1. **Configure Supabase CDN** in dashboard
2. **Update file URLs** to use CDN endpoints
3. **Set cache headers** for static assets

### **File Compression**

- **Images**: Automatically compress before upload
- **Documents**: Consider PDF compression
- **Thumbnails**: Generate optimized previews

---

## ✅ Verification Checklist

After setup, verify:

- [ ] All 10 buckets created
- [ ] RLS policies applied
- [ ] File upload works
- [ ] File download works
- [ ] Cleanup functions available
- [ ] Storage usage reporting works
- [ ] Security policies tested

---

## 🎉 Success!

Your Neuronize storage system is now ready for:

- ✅ **Secure file storage** across all system components
- ✅ **Automated cleanup** and maintenance
- ✅ **Performance monitoring** and optimization
- ✅ **Scalable architecture** for business growth

The storage infrastructure supports the entire Neuronize ecosystem including messaging, document processing, client portals, and AI processing pipelines!
