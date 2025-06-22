# 🚀 ZyxAI Startup Checklist - Get Your VAPI Integration Working

## 📋 **PRE-FLIGHT CHECKLIST**

### **Step 1: Environment Setup** ⚙️
```bash
# 1. Create/update your .env.local file
cp .env.example .env.local

# 2. Add your VAPI API keys (from your memories)
echo "VAPI_API_KEY=8db92afc-a907-40e3-805a-6c52a41c0c1f" >> .env.local
echo "NEXT_PUBLIC_VAPI_PUBLIC_KEY=4e428081-b5e6-4ab0-846d-88952b3b7bde" >> .env.local
echo "NEXT_PUBLIC_APP_URL=http://localhost:3001" >> .env.local

# 3. Add Supabase keys (if not already set)
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key" >> .env.local
```

### **Step 2: Install Dependencies** 📦
```bash
# Install all dependencies
npm install

# Verify VAPI SDK is installed
npm list @vapi-ai/server-sdk @vapi-ai/web
```

### **Step 3: Start Development Server** 🖥️
```bash
# Start the development server
npm run dev

# Server should start on http://localhost:3001
```

## 🧪 **TESTING PHASE**

### **Test 1: VAPI Health Check** 🏥
```bash
# Test VAPI connection
curl http://localhost:3001/api/vapi-health-check

# Expected response:
{
  "status": "healthy",
  "checks": {
    "environment": true,
    "apiConnection": true,
    "assistants": true,
    "phoneNumbers": true
  }
}
```

### **Test 2: Dashboard Access** 🎛️
1. **Open browser**: `http://localhost:3001`
2. **Login/Register**: Create account or login
3. **Navigate to VAPI Status**: `/dashboard/vapi-status`
4. **Run health check**: Click "Refresh Status"
5. **Verify green checkmarks**: All systems should be operational

### **Test 3: Voice Widget Test** 🎤
1. **Go to VAPI Status page**: `/dashboard/vapi-status`
2. **Click "Voice Test" tab**
3. **Click "Start Call"** on the voice widget
4. **Test voice interaction**: Speak or use text input
5. **Verify transcription**: Real-time text should appear

### **Test 4: Create Test Assistant** 🤖
```bash
# Create a test assistant via API
curl -X POST http://localhost:3001/api/vapi-health-check \
  -H "Content-Type: application/json" \
  -d '{"testType": "create-test-assistant"}'

# Expected: Assistant created and deleted successfully
```

## 🎯 **CORE WORKFLOW TESTING**

### **Workflow 1: Agent Creation → VAPI Sync** 
1. **Go to Agents**: `/dashboard/agents`
2. **Create New Agent**: 
   - Name: "Test Sales Agent"
   - Type: "sales_outbound"
   - Voice: "female_professional"
3. **Sync to VAPI**: Click "Sync to VAPI" button
4. **Verify**: Check VAPI dashboard for new assistant

### **Workflow 2: Campaign Execution**
1. **Go to Campaigns**: `/dashboard/campaigns`
2. **Create New Campaign**:
   - Name: "Test Campaign"
   - Select your test agent
   - Add test contacts (use your own phone number)
3. **Execute Campaign**: Start the campaign
4. **Monitor Calls**: Go to `/dashboard/calls` to see call status

### **Workflow 3: Real-time Call Monitoring**
1. **Start a test call** (from campaign or voice widget)
2. **Monitor in real-time**: `/dashboard/calls`
3. **Check webhooks**: Verify call status updates
4. **Review analytics**: Check call completion and results

## ✅ **SUCCESS CRITERIA**

### **🟢 VAPI Integration is Working When:**
- ✅ Health check returns "healthy" status
- ✅ Voice widget can start and maintain calls
- ✅ Agents sync to VAPI successfully
- ✅ Campaigns create and execute calls
- ✅ Real-time call status updates work
- ✅ Webhooks receive and process events
- ✅ Call analytics are tracked and displayed

### **🟡 Partial Success (Needs Attention):**
- ⚠️ Health check returns "partial" status
- ⚠️ Voice widget works but with errors
- ⚠️ Some agents fail to sync
- ⚠️ Campaigns create calls but some fail
- ⚠️ Intermittent webhook issues

### **🔴 Integration Issues (Needs Fixing):**
- ❌ Health check returns "unhealthy" or "error"
- ❌ Voice widget fails to start
- ❌ No agents can sync to VAPI
- ❌ Campaigns fail to create calls
- ❌ No webhook events received

## 🔧 **TROUBLESHOOTING GUIDE**

### **Issue: "Missing VAPI private key"**
```bash
# Check environment variables
echo $VAPI_API_KEY
echo $NEXT_PUBLIC_VAPI_PUBLIC_KEY

# If empty, add to .env.local:
echo "VAPI_API_KEY=8db92afc-a907-40e3-805a-6c52a41c0c1f" >> .env.local
echo "NEXT_PUBLIC_VAPI_PUBLIC_KEY=4e428081-b5e6-4ab0-846d-88952b3b7bde" >> .env.local

# Restart server
npm run dev
```

### **Issue: "API connection failed"**
1. **Check internet connection**
2. **Verify API keys are valid** (check VAPI dashboard)
3. **Check firewall/proxy settings**
4. **Test direct API access**:
```bash
curl -H "Authorization: Bearer 8db92afc-a907-40e3-805a-6c52a41c0c1f" \
     https://api.vapi.ai/assistant
```

### **Issue: "Voice widget not working"**
1. **Check browser console** for errors
2. **Ensure HTTPS in production** (required for microphone)
3. **Grant microphone permissions**
4. **Test in different browsers**
5. **Check public key configuration**

### **Issue: "Webhooks not received"**
1. **Verify webhook URL** is publicly accessible
2. **Check VAPI dashboard** webhook configuration
3. **Test webhook endpoint**:
```bash
curl -X POST http://localhost:3001/api/webhooks/vapi \
  -H "Content-Type: application/json" \
  -d '{"message": {"type": "test"}}'
```

## 🎉 **NEXT STEPS AFTER SUCCESS**

### **1. Production Deployment** 🌐
- Set up production environment variables
- Configure HTTPS for voice functionality
- Set up proper webhook URLs
- Test with real phone numbers

### **2. Advanced Configuration** ⚙️
- Configure industry-specific agent templates
- Set up CRM integrations
- Configure advanced analytics
- Set up team collaboration features

### **3. Scale Testing** 📈
- Test with multiple concurrent calls
- Verify campaign performance at scale
- Monitor system performance
- Set up monitoring and alerts

## 📞 **SUPPORT**

If you encounter issues:
1. **Check the logs** in browser console and server terminal
2. **Review the VAPI Status dashboard** for detailed diagnostics
3. **Test individual components** using the health check endpoints
4. **Verify environment configuration** matches this checklist

**Your ZyxAI voice automation platform should now be fully operational!** 🚀

---

**Remember**: The VAPI integration is comprehensive and should work out of the box with proper configuration. Focus on getting the environment variables set correctly first, then test each component systematically.
