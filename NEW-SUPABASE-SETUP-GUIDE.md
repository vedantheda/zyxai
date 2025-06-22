# ZyxAI - New Supabase Project Setup Guide

## 🚀 Quick Setup Overview

You're setting up ZyxAI, an AI Voice-powered business automation platform. This guide will help you set up your new Supabase project with all the necessary features for voice automation and business workflows.

## 📋 Prerequisites

1. **New Supabase Project**: `ruxxfoktithjkytgluno`
2. **Project URL**: `https://ruxxfoktithjkytgluno.supabase.co`
3. **Anon Key**: Already updated in `.env.local`
4. **Service Role Key**: ⚠️ **REQUIRED** - Get this from your Supabase dashboard

## 🔧 Step-by-Step Setup

### Step 1: Get Your Service Role Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/ruxxfoktithjkytgluno
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (long JWT token starting with `eyJ`)
4. Update your `.env.local` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 2: Set Up Database Schema

Run these SQL scripts in your Supabase SQL Editor in order:

1. **Main Database Setup**:
   ```sql
   -- Copy and paste the contents of setup-new-supabase.sql
   ```

2. **RLS Policies Setup**:
   ```sql
   -- Copy and paste the contents of setup-rls-policies.sql
   ```

3. **Storage Buckets Setup**:
   ```sql
   -- Copy and paste the contents of setup-storage-buckets.sql
   ```

4. **Storage Policies Setup**:
   ```sql
   -- Copy and paste the contents of setup-storage-policies.sql
   ```

### Step 3: Verify Setup

1. **Test Database Connection**:
   ```bash
   npm run dev
   ```

2. **Check Tables**: Go to your Supabase dashboard → Table Editor
   - Verify all tables are created
   - Check RLS is enabled

3. **Check Storage**: Go to Storage section
   - Verify all buckets are created
   - Check policies are applied

## 📊 Database Schema Overview

### Core Tables
- `profiles` - User profiles and settings
- `clients` - Client management
- `documents` - Document storage and processing
- `tasks` - Task management
- `notifications` - System notifications

### AI Voice Features
- `ai_conversations` - AI chat history
- `voice_calls` - Vapi/Eleven Labs call records
- `voice_automations` - Business automation workflows

### Messaging System
- `conversations` - Client-admin message threads
- `messages` - Individual messages

## 🗄️ Storage Buckets

### Private Buckets
- `documents` - Main document storage (50MB limit)
- `voice-recordings` - AI voice call recordings (100MB limit)
- `message-attachments` - Message file attachments (25MB limit)
- `client-files` - General client files (50MB limit)
- `processed-documents` - AI-processed files (50MB limit)
- `report-exports` - Generated reports (25MB limit)
- `temp-files` - Temporary processing files (100MB limit)

### Public Buckets
- `profile-images` - User profile pictures (5MB limit)
- `document-thumbnails` - Document preview images (2MB limit)
- `company-logos` - Company branding (5MB limit)

## 🔒 Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Proper policies for multi-user scenarios

### Storage Security
- File access restricted to owners
- Public buckets for images/thumbnails
- Proper MIME type restrictions

## 🎯 AI Voice Integration Ready

The database is pre-configured for:

### Vapi Integration
- Call tracking and management
- Transcript storage
- Action item extraction

### Eleven Labs Integration
- Voice synthesis tracking
- Audio file management
- Quality metrics

### Business Automation
- Workflow definitions
- Trigger configurations
- Execution tracking

## 🚨 Important Notes

1. **Environment Variables**: Make sure to update the service role key
2. **Old Project**: The old project remains untouched
3. **Data Migration**: No existing data is migrated (fresh start)
4. **API Keys**: Add Vapi/Eleven Labs keys when ready

## 🔄 Next Steps

1. Complete the database setup
2. Test the application with new backend
3. Add AI Voice API keys when ready:
   ```bash
   # Add to .env.local when ready
   VAPI_API_KEY=your-vapi-api-key
   ELEVEN_LABS_API_KEY=your-eleven-labs-api-key
   ```

## 🆘 Troubleshooting

### Common Issues

1. **Connection Errors**: Check service role key
2. **RLS Errors**: Verify policies are applied
3. **Storage Errors**: Check bucket policies

### Support

If you encounter issues:
1. Check Supabase logs in dashboard
2. Verify environment variables
3. Test with a simple query first

---

**Ready to build ZyxAI - Your AI Voice Business Automation Platform! 🎉**
