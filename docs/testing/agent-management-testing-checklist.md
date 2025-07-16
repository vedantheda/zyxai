# 🧪 **AGENT MANAGEMENT TESTING CHECKLIST**

## ✅ **TESTING REQUIREMENTS**

### **🗑️ Agent Deletion Testing**

#### **Frontend Testing:**
- [ ] **Delete button visible** in grid view dropdown menu
- [ ] **Delete button visible** in list view dropdown menu  
- [ ] **Confirmation dialog** appears when delete is clicked
- [ ] **Loading state** shows "Deleting..." during deletion
- [ ] **Agent removed** from UI after successful deletion
- [ ] **Error message** shown if deletion fails

#### **Backend Testing:**
- [ ] **API endpoint** `/api/agents/delete` responds correctly
- [ ] **VAPI assistant deleted** when agent has assistant ID
- [ ] **Local database deletion** works even if VAPI fails
- [ ] **Error handling** for missing agent ID
- [ ] **Error handling** for non-existent agent
- [ ] **Proper logging** of deletion process

#### **Integration Testing:**
- [ ] **Create agent** → **Delete agent** → **Verify both systems clean**
- [ ] **VAPI assistant removed** from VAPI dashboard
- [ ] **Database record removed** from ai_agents table
- [ ] **No orphaned data** left in either system

### **🎯 Simple/Advanced Mode Testing**

#### **UI Toggle Testing:**
- [ ] **Toggle buttons** visible in agent details header
- [ ] **Simple mode** shows only 2 tabs (Essentials, Voice & Script)
- [ ] **Advanced mode** shows all 4 tabs
- [ ] **Mode state** persists during session
- [ ] **Simple mode message** displays template encouragement

#### **Content Testing:**
- [ ] **Simple mode** hides advanced fields
- [ ] **Advanced mode** shows all VAPI fields
- [ ] **Template link** works in simple mode message
- [ ] **Field validation** works in both modes

### **⚙️ VAPI Field Coverage Testing**

#### **Voice Configuration:**
- [ ] **Voice provider** selection works
- [ ] **Voice ID** selection works
- [ ] **Stability settings** save correctly
- [ ] **Style settings** sync to VAPI

#### **Model Configuration:**
- [ ] **Model provider** selection works
- [ ] **Temperature** slider functions
- [ ] **Max tokens** input works
- [ ] **All model settings** sync to VAPI

#### **Audio Settings:**
- [ ] **Background sound** selection works
- [ ] **Denoising** toggle functions
- [ ] **Echo cancellation** saves correctly
- [ ] **Audio settings** sync to VAPI

#### **Advanced Features:**
- [ ] **Transcription settings** work
- [ ] **Security settings** save
- [ ] **Webhook configuration** functions
- [ ] **Tool settings** work correctly

### **🔄 Bi-directional Sync Testing**

#### **Automatic Sync Testing:**
- [ ] **Agent creation** creates VAPI assistant
- [ ] **Agent updates** sync to VAPI immediately
- [ ] **Agent deletion** removes from VAPI
- [ ] **No manual sync** button visible

#### **Sync Verification:**
- [ ] **Create agent** → **Check VAPI dashboard** → **Assistant exists**
- [ ] **Update agent** → **Check VAPI dashboard** → **Changes reflected**
- [ ] **Delete agent** → **Check VAPI dashboard** → **Assistant removed**

---

## 🚀 **QUICK TEST SCENARIOS**

### **Scenario 1: Complete Agent Lifecycle**
1. **Create new agent** in ZyxAI
2. **Verify VAPI assistant** created automatically
3. **Update agent settings** in ZyxAI
4. **Verify changes** reflected in VAPI
5. **Delete agent** from ZyxAI
6. **Verify VAPI assistant** removed

### **Scenario 2: Simple vs Advanced Mode**
1. **Open agent details** page
2. **Start in Simple mode** → **Verify 2 tabs only**
3. **Switch to Advanced mode** → **Verify 4 tabs**
4. **Test field visibility** in both modes
5. **Verify template encouragement** in Simple mode

### **Scenario 3: Comprehensive Field Testing**
1. **Switch to Advanced mode**
2. **Test voice settings** → **Save** → **Verify VAPI sync**
3. **Test model settings** → **Save** → **Verify VAPI sync**
4. **Test audio settings** → **Save** → **Verify VAPI sync**
5. **Test security settings** → **Save** → **Verify VAPI sync**

### **Scenario 4: Error Handling**
1. **Try deleting non-existent agent** → **Verify error message**
2. **Test with network issues** → **Verify graceful handling**
3. **Test VAPI API failures** → **Verify local deletion still works**

---

## 🎯 **SUCCESS CRITERIA**

### **✅ Agent Deletion**
- **Confirmation required** before deletion
- **Both systems cleaned** (local + VAPI)
- **UI updated immediately** after deletion
- **Error handling** works gracefully

### **✅ Simple/Advanced Mode**
- **Toggle works** smoothly
- **Content changes** appropriately
- **Template encouragement** visible in Simple mode
- **All fields accessible** in Advanced mode

### **✅ VAPI Field Coverage**
- **All documented fields** available in UI
- **Settings save** correctly
- **Changes sync** to VAPI immediately
- **Field validation** works properly

### **✅ Bi-directional Sync**
- **No manual sync** needed
- **Real-time updates** to VAPI
- **Consistent data** between systems
- **Reliable operation** under all conditions

---

## 🔧 **TESTING TOOLS**

### **Manual Testing:**
- **Browser DevTools** - Check network requests
- **VAPI Dashboard** - Verify assistant changes
- **Database queries** - Check local data
- **Console logs** - Monitor sync operations

### **API Testing:**
```bash
# Test delete endpoint
curl -X DELETE http://localhost:3001/api/agents/delete \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent-id"}'

# Test agent update
curl -X PATCH http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-id", "updates": {...}}'
```

### **Database Verification:**
```sql
-- Check agent exists
SELECT * FROM ai_agents WHERE id = 'agent-id';

-- Check VAPI assistant ID
SELECT voice_config->>'vapi_assistant_id' FROM ai_agents WHERE id = 'agent-id';
```

---

## 🎉 **TESTING COMPLETION**

When all tests pass, you'll have:
- **✅ Reliable agent deletion** with VAPI sync
- **✅ User-friendly mode switching** 
- **✅ Complete VAPI field coverage**
- **✅ Automatic bi-directional sync**
- **✅ Professional agent management**

**Ready for production use!** 🚀
