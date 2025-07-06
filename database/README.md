# 🗄️ ZyxAI Database Setup

This directory contains all database setup scripts for ZyxAI. Run these scripts in order in your Supabase SQL Editor.

## 📋 Setup Order

Run these scripts in the following order:

### 1. Schema Setup
```sql
-- File: 01-schema.sql
-- Creates all tables and basic structure
```

### 2. Security Policies
```sql
-- File: 02-rls-policies.sql
-- Sets up Row Level Security policies
```

### 3. Performance Indexes
```sql
-- File: 03-indexes.sql
-- Creates indexes for optimal performance
```

### 4. Seed Data
```sql
-- File: 04-seed-data.sql
-- Inserts initial data and templates
```

## 🚀 Quick Setup

1. Go to your Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
   ```

2. Copy and run each file in order (01 → 02 → 03 → 04)

3. Verify setup:
   ```bash
   npm run test:db
   ```

## 📁 File Descriptions

- **01-schema.sql**: Core database schema with all tables
- **02-rls-policies.sql**: Row Level Security policies for data protection
- **03-indexes.sql**: Database indexes for performance optimization
- **04-seed-data.sql**: Initial data including industry templates and sample agents

## 🔧 Troubleshooting

**Script Errors**: Run scripts one at a time and check for errors
**Permission Issues**: Ensure you're using the service role key
**Missing Tables**: Verify 01-schema.sql ran successfully before proceeding

## 📚 Related Documentation

- [Complete Setup Guide](../docs/setup/complete-setup-guide.md)
- [Database Documentation](../docs/database/)
- [Architecture Overview](../docs/architecture/)
