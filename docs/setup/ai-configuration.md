# AI Configuration Guide

## 🤖 **OpenRouter Setup (Free AI Models)**

### **Step 1: Get Free OpenRouter API Key**

1. **Visit OpenRouter**: Go to [https://openrouter.ai](https://openrouter.ai)
2. **Sign Up**: Create a free account
3. **Get API Key**: Go to [Keys](https://openrouter.ai/keys) and create a new API key
4. **Free Credits**: New accounts get $1 in free credits
5. **Free Models**: Many models are completely free (no credits required)

### **Step 2: Configure Environment Variables**

```bash
# Copy the example file
cp .env.example .env.local

# Add your OpenRouter API key
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

### **Step 3: Best Free Models Available**

#### **🥇 DeepSeek V3 (Recommended)**
- **Model ID**: `deepseek/deepseek-chat:free`
- **Parameters**: 671B (massive model)
- **Context**: 163K tokens
- **Cost**: Completely FREE
- **Best for**: Complex reasoning, coding, analysis

#### **🥈 Qwen2.5 72B Instruct**
- **Model ID**: `qwen/qwen-2.5-72b-instruct:free`
- **Parameters**: 72B
- **Context**: 32K tokens
- **Cost**: Completely FREE
- **Best for**: General tasks, tax calculations

#### **🥉 Llama 3.3 70B**
- **Model ID**: `meta-llama/llama-3.3-70b-instruct:free`
- **Parameters**: 70B
- **Context**: 128K tokens
- **Cost**: Completely FREE
- **Best for**: Balanced performance

## 🔧 **Configuration Options**

### **Default Model Selection**
The system is configured to use **DeepSeek V3** by default as it's the most powerful free model available.

### **Model Switching**
You can change models by updating the configuration in:
- `src/lib/ai/AIService.ts`
- `src/lib/ai-processing/DocumentAnalysisEngine.ts`
- `src/lib/services/ServiceManager.ts`

### **Performance Optimization**
- **Temperature**: Set to 0.1 for consistent, factual responses
- **Max Tokens**: Set to 2000 for detailed responses
- **Context**: Includes tax-specific system prompts

## 🎯 **AI Assistant Features**

### **Tax-Focused Capabilities**
- Document analysis and data extraction
- Tax calculations and projections
- Compliance guidance and deadline tracking
- Business tax optimization strategies
- Client management insights

### **Professional System Prompts**
The AI is configured with comprehensive tax knowledge including:
- Current tax year regulations
- IRS codes and publications
- Professional communication style
- Accuracy and compliance focus

## 🚀 **Testing the Setup**

1. **Start the application**: `npm run dev`
2. **Visit AI Assistant**: `http://localhost:3000/ai-assistant`
3. **Create conversation**: Click the + button
4. **Test with tax question**: "Help me calculate quarterly taxes for a client with $100,000 income"
5. **Verify response**: Should get detailed, professional tax guidance

## 🔒 **Security Notes**

- **Never commit API keys** to version control
- **Use environment variables** for all sensitive data
- **Free models** don't require payment info
- **Rate limits** apply to free usage

## 🆘 **Troubleshooting**

### **"Demo Mode" Messages**
If you see demo mode messages, check:
1. API key is correctly set in `.env.local`
2. Environment variables are loaded (restart dev server)
3. API key format is correct (starts with `sk-or-v1-`)

### **API Errors**
- Check OpenRouter status at [status.openrouter.ai](https://status.openrouter.ai)
- Verify API key permissions
- Check rate limits and usage

### **Model Not Available**
- Some free models may have usage limits
- Try alternative free models listed above
- Check OpenRouter models page for current availability

## 📚 **Additional Resources**

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Models List](https://openrouter.ai/models)
- [OpenRouter API Reference](https://openrouter.ai/docs/api-reference)
