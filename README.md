# 🏢 Neuronize - Professional Tax Practice Management

## 🎯 Overview
Enterprise-grade tax practice management system with AI-powered document processing, client management, and automated workflows.

## ✨ Key Features
- 🤖 **AI Document Processing** - Automated OCR and data extraction
- 👥 **Client Management** - Complete client lifecycle management
- 📄 **Document Management** - Secure document storage and processing
- 💬 **Communication Hub** - Integrated messaging system
- 📊 **Pipeline Management** - Visual workflow tracking
- 💰 **Bookkeeping Integration** - Financial data management
- 📈 **Analytics & Reporting** - Business intelligence dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)
- Google Vision API key (for AI processing)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd neuronize

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
GOOGLE_VISION_API_KEY=your_google_vision_api_key
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
- **AI Processing**: Google Vision API + OpenRouter
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
