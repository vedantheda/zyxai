# ZyxAI - Quick Reference Guide
## Developer Cheat Sheet & Common Operations

---

## 🚀 **QUICK START**

### **Development Setup**
```bash
# Clone and setup
git clone <repository>
cd zyxai
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your keys

# Start development
npm run dev
# Access: http://localhost:3001
```

### **Key URLs**
- **Dashboard**: http://localhost:3001/dashboard
- **Agent Demo**: http://localhost:3001/dashboard/agents/demo
- **Agent Config**: http://localhost:3001/dashboard/agents/[id]
- **Login**: http://localhost:3001/auth/login

---

## 🔑 **ENVIRONMENT VARIABLES**

### **Required Variables**
```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://wfsbwhkdnwlcvmiczgph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Vapi (Optional - for live voice)
# NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_public_key
VAPI_PRIVATE_KEY=8db92afc-a907-40e3-805a-6c52a41c0c1f

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### **Test Accounts**
```bash
# Admin Account
Email: admin@zyxai.com
Password: admin123

# User Account  
Email: user@zyxai.com
Password: user123
```

---

## 🎤 **VOICE INTEGRATION**

### **Vapi Assistant IDs**
```javascript
// Available assistants (working with private key)
const assistants = {
  riley_copy: "5c4bdaf5-6af8-43cd-b425-a55e792c97c0",
  riley: "d881da92-b1b6-4f0d-ad86-cd578135dc7f", 
  riley_basic: "a28e5437-3d9f-4e71-bb01-a1e2b218b2c6"
}
```

### **Voice Widget Usage**
```tsx
<VoiceWidget
  assistantId="5c4bdaf5-6af8-43cd-b425-a55e792c97c0"
  voiceId="female_professional"
  agentName="Sam"
  agentGreeting="Hi, this is Sam..."
  variant="card"
/>
```

### **Voice Configuration**
```typescript
const voiceTypes = [
  'female_professional',
  'female_friendly', 
  'female_caring',
  'male_professional',
  'male_warm',
  'male_trustworthy'
]
```

---

## 🗄️ **DATABASE OPERATIONS**

### **Common Queries**
```sql
-- Get all agents for user
SELECT * FROM ai_agents WHERE user_id = 'user-id';

-- Get agent with full config
SELECT a.*, v.*, s.*, p.*
FROM ai_agents a
LEFT JOIN voice_configs v ON a.id = v.agent_id
LEFT JOIN script_configs s ON a.id = s.agent_id  
LEFT JOIN personality_configs p ON a.id = p.agent_id
WHERE a.id = 'agent-id';

-- Get call history
SELECT * FROM calls WHERE agent_id = 'agent-id' ORDER BY created_at DESC;
```

### **Service Classes**
```typescript
// Agent operations
const agent = await AgentService.createAgent(data)
const agents = await AgentService.getAgentsByUser(userId)
const agent = await AgentService.updateAgent(id, updates)

// Auth operations
const user = await AuthService.signIn(email, password)
const user = await AuthService.signUp(email, password, userData)
```

---

## 🎨 **UI COMPONENTS**

### **Common Components**
```tsx
// Buttons
<Button variant="default">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Ghost</Button>

// Cards
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Badges
<Badge variant="default">Active</Badge>
<Badge variant="outline">Inactive</Badge>
<Badge variant="destructive">Error</Badge>
```

### **Layout Components**
```tsx
// Page layout
<AppLayout>
  <div className="container mx-auto p-6">
    <h1 className="text-3xl font-bold">Page Title</h1>
    {/* Content */}
  </div>
</AppLayout>

// Dashboard layout
<DashboardLayout>
  <DashboardHeader title="Page Title" />
  <DashboardContent>
    {/* Content */}
  </DashboardContent>
</DashboardLayout>
```

---

## 🔧 **COMMON TASKS**

### **Creating New Agent**
```typescript
const newAgent = {
  name: "Agent Name",
  description: "Agent description",
  agent_type: "outbound_calling",
  skills: ["lead_qualification", "appointment_scheduling"],
  is_active: true,
  user_id: userId
}

const { data, error } = await AgentService.createAgent(newAgent)
```

### **Adding Voice Configuration**
```typescript
const voiceConfig = {
  agent_id: agentId,
  voice_id: "female_professional",
  speed: 1.0,
  pitch: 1.0,
  stability: 0.8,
  similarity_boost: 0.75
}

await supabase.from('voice_configs').insert([voiceConfig])
```

### **Testing Voice Demo**
```typescript
// Navigate to agent page
http://localhost:3001/dashboard/agents/[agent-id]

// Click "Demo" tab
// Click "Start Call" 
// Test voice interaction
```

---

## 🐛 **DEBUGGING**

### **Common Issues & Solutions**

#### **Voice Not Working**
```bash
# Check console for errors
# Verify Vapi key in .env.local
# Check browser permissions
# Test with demo mode
```

#### **Database Connection Issues**
```bash
# Verify Supabase URL and keys
# Check network connection
# Verify RLS policies
```

#### **Authentication Problems**
```bash
# Clear browser storage
# Check auth configuration
# Verify user exists in database
```

### **Debug Console Commands**
```javascript
// Check Vapi status
console.log('Vapi instance:', vapiRef.current)

// Check auth status  
console.log('User:', await supabase.auth.getUser())

// Check environment
console.log('Env vars:', process.env)
```

---

## 📊 **TESTING**

### **Manual Testing Checklist**
```bash
# Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials  
- [ ] Logout functionality
- [ ] Role-based access

# Agent Management
- [ ] Create new agent
- [ ] Edit agent configuration
- [ ] Delete agent
- [ ] View agent list

# Voice Demo
- [ ] Start voice call
- [ ] Test microphone input
- [ ] Test text input
- [ ] End call properly
```

### **API Testing**
```bash
# Test agent API
curl -X GET "http://localhost:3001/api/agents?userId=user-id"

# Test auth API
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

---

## 🚀 **DEPLOYMENT**

### **Build Commands**
```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

### **Environment Setup**
```bash
# Development
NODE_ENV=development

# Production  
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 📝 **CODE SNIPPETS**

### **API Route Template**
```typescript
// app/api/example/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const param = searchParams.get('param')
    
    // Your logic here
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

### **Component Template**
```tsx
// components/ExampleComponent.tsx
interface ExampleProps {
  title: string
  children?: React.ReactNode
}

export function ExampleComponent({ title, children }: ExampleProps) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  )
}
```

### **Service Template**
```typescript
// lib/services/ExampleService.ts
export class ExampleService {
  static async getData(id: string) {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }
}
```

---

## 🔗 **USEFUL LINKS**

### **Documentation**
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vapi Docs](https://docs.vapi.ai)
- [Shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

### **Tools**
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vapi Dashboard](https://dashboard.vapi.ai)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

## 📞 **SUPPORT CONTACTS**

### **Technical Issues**
- **Supabase**: support@supabase.com
- **Vapi**: support@vapi.ai  
- **Vercel**: support@vercel.com

### **Development Team**
- **Primary Developer**: [Your contact]
- **Product Owner**: [Contact]
- **Project Repository**: [GitHub/GitLab URL]

---

*Last Updated: June 15, 2025*
*Version: 1.0*
*Quick Reference for ZyxAI Development Team*
