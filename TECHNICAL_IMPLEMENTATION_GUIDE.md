# ZyxAI - Technical Implementation Guide
## Development Setup & Implementation Details

---

## 🛠️ **DEVELOPMENT SETUP**

### **Prerequisites**
- Node.js 20.12.0+
- npm 10.5.0+
- Git
- Supabase account
- Vapi account

### **Environment Configuration**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://wfsbwhkdnwlcvmiczgph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Vapi Configuration (currently commented out)
# NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
VAPI_PRIVATE_KEY=8db92afc-a907-40e3-805a-6c52a41c0c1f

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### **Installation & Startup**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access application
http://localhost:3001
```

---

## 🏗️ **ARCHITECTURE OVERVIEW**

### **Frontend Architecture**
```
src/
├── app/                    # Next.js 15 App Router
│   ├── dashboard/         # Protected dashboard routes
│   ├── auth/             # Authentication pages
│   └── api/              # API routes
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn/ui base components
│   ├── voice/           # Voice-related components
│   └── layout/          # Layout components
├── lib/                 # Utility libraries
│   ├── services/        # API service classes
│   ├── supabase/       # Supabase client
│   └── utils/          # Helper functions
└── types/              # TypeScript type definitions
```

### **Database Schema**
```sql
-- Core Tables
users                    # User accounts and profiles
ai_agents               # AI agent configurations
voice_configs           # Voice settings and preferences
script_configs          # Conversation scripts
personality_configs     # Agent personality traits
calls                   # Call records and metadata
call_transcripts        # Conversation transcripts
analytics              # Performance metrics
```

---

## 🎤 **VOICE INTEGRATION IMPLEMENTATION**

### **Vapi Web SDK Integration**
```typescript
// Installation
npm install @vapi-ai/web

// Implementation
import Vapi from '@vapi-ai/web'

const vapi = new Vapi(publicKey)
await vapi.start(assistantId)
```

### **Voice Widget Component**
```typescript
// Usage
<VoiceWidget
  assistantId="5c4bdaf5-6af8-43cd-b425-a55e792c97c0"
  voiceId="female_professional"
  agentName="Sam"
  agentGreeting="Hi, this is Sam calling from..."
  variant="card"
  onCallStart={() => console.log('Call started')}
  onCallEnd={() => console.log('Call ended')}
/>
```

### **Available Vapi Assistants**
```javascript
// Production-ready assistants
const assistants = [
  {
    id: "5c4bdaf5-6af8-43cd-b425-a55e792c97c0",
    name: "Riley German (Copy)",
    voice: "11labs"
  },
  {
    id: "d881da92-b1b6-4f0d-ad86-cd578135dc7f", 
    name: "Riley German",
    voice: "11labs"
  },
  {
    id: "a28e5437-3d9f-4e71-bb01-a1e2b218b2c6",
    name: "Riley",
    voice: "vapi"
  }
]
```

### **Voice Configuration Mapping**
```typescript
const voiceMapping = {
  'female_professional': ['Microsoft Emma', 'Microsoft Aria'],
  'female_friendly': ['Microsoft Jenny', 'Microsoft Aria'],
  'male_professional': ['Microsoft Andrew', 'Microsoft Guy'],
  'male_warm': ['Microsoft Brian', 'Microsoft Guy']
}
```

---

## 🔐 **AUTHENTICATION & SECURITY**

### **Supabase Auth Implementation**
```typescript
// Auth service
export class AuthService {
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password
    })
    return { data, error }
  }

  static async signUp(email: string, password: string, userData: any) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: userData }
    })
    return { data, error }
  }
}
```

### **Role-Based Access Control**
```typescript
// User roles
type UserRole = 'admin' | 'user' | 'agent'

// Middleware protection
export async function middleware(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user && isProtectedRoute(pathname)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}
```

### **Row Level Security Policies**
```sql
-- Users can only access their own data
CREATE POLICY "Users can view own data" ON ai_agents
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can access all data
CREATE POLICY "Admins can view all data" ON ai_agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 📊 **DATA MANAGEMENT**

### **Agent Service Implementation**
```typescript
export class AgentService {
  static async createAgent(agentData: Partial<AIAgent>) {
    const { data, error } = await supabase
      .from('ai_agents')
      .insert([agentData])
      .select()
      .single()
    
    return { data, error }
  }

  static async getAgentsByUser(userId: string) {
    const { data, error } = await supabase
      .from('ai_agents')
      .select(`
        *,
        voice_config:voice_configs(*),
        script_config:script_configs(*),
        personality_config:personality_configs(*)
      `)
      .eq('user_id', userId)
    
    return { data, error }
  }
}
```

### **Real-time Subscriptions**
```typescript
// Real-time agent updates
useEffect(() => {
  const subscription = supabase
    .channel('agents')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'ai_agents' },
      (payload) => {
        console.log('Agent updated:', payload)
        // Update local state
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [])
```

---

## 🎨 **UI COMPONENT SYSTEM**

### **Shadcn/ui Integration**
```typescript
// Component usage
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Custom component example
export function AgentCard({ agent }: { agent: AIAgent }) {
  return (
    <Card>
      <CardHeader>
        <h3>{agent.name}</h3>
        <Badge variant="outline">{agent.agent_type}</Badge>
      </CardHeader>
      <CardContent>
        <p>{agent.description}</p>
      </CardContent>
    </Card>
  )
}
```

### **Theme Configuration**
```typescript
// Dark theme support
const theme = {
  dark: {
    background: "hsl(222.2 84% 4.9%)",
    foreground: "hsl(210 40% 98%)",
    primary: "hsl(210 40% 98%)",
    // ... other colors
  }
}
```

---

## 🔄 **API ROUTES & SERVICES**

### **API Route Structure**
```typescript
// app/api/agents/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    const { data, error } = await AgentService.getAgentsByUser(userId)
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

### **Error Handling**
```typescript
// Global error handler
export function handleApiError(error: any) {
  console.error('API Error:', error)
  
  if (error.code === 'PGRST116') {
    return { error: 'Resource not found', status: 404 }
  }
  
  return { error: 'Internal server error', status: 500 }
}
```

---

## 🧪 **TESTING STRATEGY**

### **Unit Testing Setup**
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Test configuration
# jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}
```

### **Component Testing Example**
```typescript
// __tests__/components/VoiceWidget.test.tsx
import { render, screen } from '@testing-library/react'
import { VoiceWidget } from '@/components/voice/VoiceWidget'

describe('VoiceWidget', () => {
  it('renders start call button', () => {
    render(<VoiceWidget assistantId="test" />)
    expect(screen.getByText('Start Call')).toBeInTheDocument()
  })
})
```

---

## 🚀 **DEPLOYMENT CONFIGURATION**

### **Vercel Deployment**
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### **Environment Variables**
```bash
# Production environment
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
VAPI_PRIVATE_KEY=your_vapi_private_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 🔍 **DEBUGGING & MONITORING**

### **Development Debugging**
```typescript
// Console logging for voice operations
console.log('🎤 Vapi initialized:', vapiInstance)
console.log('📞 Call started:', callData)
console.log('💬 Message received:', message)
console.log('❌ Error occurred:', error)
```

### **Error Tracking**
```typescript
// Error boundary implementation
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component error:', error, errorInfo)
    // Send to error tracking service
  }
}
```

---

## 📝 **CODE STANDARDS**

### **TypeScript Configuration**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### **Code Formatting**
```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "prefer-const": "error",
    "no-unused-vars": "warn",
    "@typescript-eslint/no-unused-vars": "warn"
  }
}
```

---

*Last Updated: June 15, 2025*
*Version: 1.0*
*Status: Active Development*
