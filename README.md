# 🎙️ ZyxAI - AI Voice-Powered Business Automation Platform

## 🎯 Overview
Enterprise-grade business automation platform powered by advanced AI voice technology. Streamline operations, automate workflows, and enhance customer interactions through intelligent voice assistants.

## ✨ Key Features
- 🎙️ **AI Voice Integration** - Vapi and Eleven Labs voice automation
- 🤖 **Smart Automation** - Intelligent business workflow automation
- 👥 **Client Management** - Complete client lifecycle management
- 📄 **Document Management** - Secure document storage and processing
- 💬 **Voice Communication** - AI-powered voice interactions
- 📊 **Workflow Automation** - Visual automation pipeline management
- 📈 **Analytics & Insights** - Voice interaction analytics and reporting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)
- Vapi API key (for AI voice automation)
- Eleven Labs API key (for voice synthesis)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd zyxai

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Configure your environment variables

# Run development server
npm run dev
```

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VAPI_API_KEY=your_vapi_api_key
ELEVEN_LABS_API_KEY=your_eleven_labs_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

## 📚 Documentation
Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- 🚀 [Features Documentation](./docs/features/)
- 🏢 [Development Guide](./docs/development/)
- 🔒 [Security Documentation](./docs/security/)
- 🚀 [Deployment Guide](./docs/deployment/)

## 🏗️ Architecture
- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **AI Voice**: Vapi + Eleven Labs Integration
- **AI Processing**: OpenRouter + Custom AI Models
- **Styling**: Tailwind CSS + shadcn/ui

## 🧪 Testing
```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment
See [Production Deployment Checklist](./docs/deployment/production-checklist.md) for detailed deployment instructions.

## 📄 License
Private - All rights reserved

## 🤝 Contributing
This is a private project. Please follow the established coding standards and documentation practices.
