import { NextRequest, NextResponse } from 'next/server'
import { withApiSecurity } from '@/lib/apiSecurity'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, temperature = 0.1, maxTokens = 1500 } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Build optimized system prompt for tax assistant
    const currentYear = new Date().getFullYear()
    const systemPrompt = `You are Neuronize AI, an expert tax professional assistant. Provide accurate, well-formatted responses about US tax law for ${currentYear}.

**FORMATTING REQUIREMENTS:**
• Use proper markdown formatting with headers (##, ###)
• Use bullet points (•) and numbered lists (1., 2., 3.)
• Bold important terms with **text**
• Use line breaks for readability
• Format calculations clearly with step-by-step breakdowns

**EXPERTISE:**
• Tax calculations and projections
• Document analysis (W-2, 1099s, Schedule C)
• Tax planning and optimization
• IRS regulations and compliance
• Business tax matters

**RESPONSE STYLE:**
• Be concise but comprehensive
• Provide specific calculations when relevant
• Use professional tax terminology
• Include compliance considerations
• Always recommend consulting a tax professional for complex situations`

    // Prepare messages with system prompt
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Neuronize'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        messages: aiMessages,
        temperature,
        max_tokens: maxTokens
      })
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `AI API error: ${response.status} ${response.statusText}` },
        { status: response.status, headers: corsHeaders }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || 'No response generated'

    return NextResponse.json(
      {
        response: aiResponse,
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        usage: data.usage
      },
      { headers: corsHeaders }
    )

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}
