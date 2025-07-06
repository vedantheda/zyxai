import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'VAPI API key not configured' },
        { status: 500 }
      );
    }

    // Fetch assistants from VAPI API
    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('VAPI API Error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          error: `Failed to fetch assistants: ${response.status} ${response.statusText}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const assistants = await response.json();
    
    // Return the assistants data with simplified format
    const simplifiedAssistants = assistants.map((assistant: any) => ({
      id: assistant.id,
      name: assistant.name || 'Unnamed Assistant',
      model: assistant.model?.model || 'Unknown Model',
      voice: assistant.voice?.provider || 'Unknown Voice',
      createdAt: assistant.createdAt
    }));
    
    return NextResponse.json({
      success: true,
      count: assistants.length,
      assistants: simplifiedAssistants,
      raw: assistants // Include raw data for debugging
    });
    
  } catch (error) {
    console.error('Error fetching assistants:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching assistants' },
      { status: 500 }
    );
  }
}
