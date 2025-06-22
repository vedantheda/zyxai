# 🚀 ZyxAI Quick Setup Guide

## **STEP 1: Complete Service Role Key** ⚠️ REQUIRED

1. Go to: https://supabase.com/dashboard/project/wfsbwhkdnwlcvmiczgph/settings/api
2. Copy the **complete** `service_role` key (very long JWT token)
3. Update line 7 in `.env.local` with the complete key

## **STEP 2: Run Database Setup**

Go to your Supabase SQL Editor: https://supabase.com/dashboard/project/wfsbwhkdnwlcvmiczgph/sql

### **2.1: Main Schema** (Copy & Run)
```sql
-- Copy the entire contents of database-schema-zyxai.sql and run it
```

### **2.2: Security Policies** (Copy & Run)
```sql
-- Copy the entire contents of database-rls-policies.sql and run it
```

### **2.3: Performance Indexes** (Copy & Run)
```sql
-- Copy the entire contents of database-indexes.sql and run it
```

### **2.4: Seed Data** (Copy & Run)
```sql
-- Copy the entire contents of database-seed-data.sql and run it
```

## **STEP 3: Test Setup**

```bash
npm run test:db
```

Should show: "✅ Connection successful! ✅ Tables already exist!"

## **STEP 4: Start Development**

```bash
npm run dev
```

---

## **What You'll Get**

### **🏢 Business Niches Ready**
- **Real Estate** with agents: Sam (Cold Caller), Jessica (Scheduler), Marcus (Follow-up)
- **Insurance** with agents: David (Lead Qualifier), Sarah (Policy Review)
- **Healthcare** with agents: Emma (Scheduler), Michael (Reminders)
- **Financial Services** with agent: Robert (Lead Qualifier)
- **Home Services** with agent: Tony (Lead Qualifier)

### **🤖 AI Agent System**
- Pre-built agent templates with personalities and scripts
- Customizable voice configurations
- Skill-based agent types
- Performance tracking

### **📞 Call Management**
- Campaign creation and management
- Contact list management
- Call tracking and analytics
- Vapi integration ready

### **📊 Analytics & Reporting**
- Daily performance metrics
- Conversion tracking
- Sentiment analysis
- ROI calculations

### **🔗 Integration Framework**
- CRM connections (Salesforce, HubSpot, etc.)
- Calendar integrations
- Webhook system
- External API support

---

## **Database Tables Created**

### **Core System**
- `organizations` - Multi-tenant companies
- `users` - Team members with roles
- `business_niches` - Industry templates
- `agent_templates` - Pre-built AI agents

### **Operations**
- `ai_agents` - Customized agents per organization
- `contact_lists` & `contacts` - Contact management
- `call_campaigns` & `calls` - Campaign and call tracking
- `call_events` - Detailed call event logging

### **Integrations**
- `integrations` - External service connections
- `webhooks` - Event notifications
- `daily_analytics` - Performance metrics
- `notifications` & `activity_logs` - System activity

---

## **🎯 Ready to Build!**

Once setup is complete, you'll have a fully functional foundation for:

✅ Multi-tenant AI voice automation platform  
✅ 5 business niches with 9 pre-built AI agents  
✅ Complete call management system  
✅ Analytics and reporting framework  
✅ Integration-ready architecture  
✅ Security-first design with RLS policies  

**Time to revolutionize business automation with AI voice technology! 🚀**
