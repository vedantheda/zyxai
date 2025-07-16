# 🚀 ZyxAI Complete Setup Guide

## Overview
This guide will walk you through setting up ZyxAI from scratch, including environment configuration, database setup, and initial testing.

## Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)
- Vapi API key (for AI voice automation)
- Eleven Labs API key (for voice synthesis)

## Step 1: Environment Configuration

### 1.1 Clone and Install
```bash
# Clone repository
git clone <repository-url>
cd zyxai

# Install dependencies
npm install
```

### 1.2 Environment Setup
```bash
# Copy environment template
cp .env.example .env.local
```

### 1.3 Configure Environment Variables
Update `.env.local` with your credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_complete_service_role_key

# AI Voice Integration
VAPI_API_KEY=your_vapi_api_key
ELEVEN_LABS_API_KEY=your_eleven_labs_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Application Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

**Important**: Get the complete service role key from your Supabase dashboard:
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
2. Copy the complete **service_role** key (long JWT token)

## Step 2: Database Setup

### 2.1 Test Database Connection
```bash
npm run test:db
```

### 2.2 Run Database Setup Scripts
Go to your Supabase SQL Editor and run these files in order:

1. **Main Schema**: `database/01-schema.sql`
2. **Security Policies**: `database/02-rls-policies.sql`
3. **Performance Indexes**: `database/03-indexes.sql`
4. **Seed Data**: `database/04-seed-data.sql`

See [Database Setup Guide](../../database/README.md) for detailed instructions.

### 2.3 Verify Setup
Check that the application starts successfully with `npm run dev`.

## Step 3: Development Server

### 3.1 Start Development Server
```bash
npm run dev
```

### 3.2 Access Application
Open [http://localhost:3000](http://localhost:3000) in your browser.



# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
```

## Step 5: AI Voice Configuration

### 5.1 Vapi Setup
1. Create account at [Vapi.ai](https://vapi.ai)
2. Get API key from dashboard
3. Configure voice assistants in the ZyxAI interface

### 5.2 Eleven Labs Setup
1. Create account at [Eleven Labs](https://elevenlabs.io)
2. Get API key from settings
3. Configure voice synthesis options

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify service role key is complete
- Check Supabase project URL
- Ensure database is accessible

**Voice Integration Not Working**
- Verify API keys are correct
- Check API quotas and limits
- Review network connectivity

**Build Errors**
- Clear node_modules and reinstall
- Check Node.js version (18+ required)
- Verify TypeScript configuration

### Getting Help
- Check the [Development Guide](../development/)
- Review [Architecture Documentation](../architecture/)
- See [Security Implementation](../security/)

## Next Steps
After successful setup:
1. Configure your first voice assistant
2. Set up workflow automation
3. Customize industry templates
4. Configure analytics and reporting

## Production Deployment
For production deployment, see the [Production Deployment Guide](../deployment/production-checklist.md).
