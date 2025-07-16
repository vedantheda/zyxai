# 🏗️ Neuronize - Clean Codebase Structure

## 📁 Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (routes)/                 # Main application routes
│   ├── api/                      # API endpoints
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # React components
│   ├── features/                 # Feature-specific components
│   │   ├── auth/                 # Authentication components
│   │   ├── clients/              # Client management
│   │   ├── documents/            # Document handling
│   │   ├── messages/             # Communication
│   │   ├── pipeline/             # Pipeline management
│   │   ├── bookkeeping/          # Financial features
│   │   └── reports/              # Analytics & reporting
│   ├── ui/                       # Base UI components (shadcn/ui)
│   ├── layout/                   # Layout components
│   ├── common/                   # Shared components
│   └── providers/                # React providers
├── lib/                          # Core business logic
│   ├── services/                 # Business services
│   ├── utils/                    # Utility functions
│   ├── types/                    # TypeScript definitions
│   ├── constants/                # Application constants
│   ├── config/                   # Configuration
│   ├── validations/              # Schema validations
│   ├── auth/                     # Authentication logic
│   ├── database/                 # Database utilities
│   ├── security/                 # Security utilities
│   └── monitoring/               # Logging & monitoring
├── hooks/                        # Custom React hooks
│   ├── features/                 # Feature-specific hooks
│   └── [core hooks]              # Core application hooks
├── contexts/                     # React contexts
├── styles/                       # Global styles

```

## 🎯 Clean Architecture Benefits

✅ **Feature-based organization** - Related code grouped together
✅ **Clear separation of concerns** - UI, business logic, and data separate
✅ **Scalable structure** - Easy to add new features
✅ **Professional standards** - Industry best practices
✅ **Easy navigation** - Logical file organization
✅ **Reduced duplication** - No redundant components or services

## 🚀 Import Patterns

```typescript
// Feature components
import { DocumentManager, DocumentUpload } from '@/components/features/documents'

// Feature hooks
import { useDocuments, useMessages } from '@/hooks/features'

// Core services
import { DocumentService, ClientService } from '@/lib/services'

// Types
import type { Pipeline, Client, Document } from '@/lib/types'
```

## 📊 Professional Grade

This codebase now follows enterprise-grade organization patterns used by:
- Fortune 500 companies
- Modern SaaS applications  
- Professional development teams
- Scalable software architectures
