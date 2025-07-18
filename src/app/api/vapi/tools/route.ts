import { NextRequest, NextResponse } from 'next/server'
import { VapiClient } from '@vapi-ai/server-sdk'
import { VapiTool } from '@/lib/types/VapiAdvancedConfig'

const vapi = new VapiClient({
  token: process.env.VOICE_AI_API_KEY || process.env.VOICE_AI_PRIVATE_KEY!
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Fetching VAPI tools...')
    
    const tools = await vapi.tools.list()
    
    return NextResponse.json({
      success: true,
      tools: tools.map(tool => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        type: tool.type,
        createdAt: tool.createdAt,
        updatedAt: tool.updatedAt
      }))
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error fetching tools:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tools',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tools }: { tools: VapiTool[] } = await request.json()

    console.log('🔧 Creating/updating VAPI tools:', JSON.stringify(tools, null, 2))

    const results = []

    for (const tool of tools) {
      try {
        let toolConfig: any = {
          name: tool.name,
          description: tool.description,
          type: tool.type
        }

        // Configure based on tool type
        switch (tool.type) {
          case 'apiRequest':
            toolConfig = {
              ...toolConfig,
              method: tool.method || 'POST',
              url: tool.url,
              headers: tool.headers || {},
              body: tool.body || {},
              timeoutSeconds: tool.timeoutSeconds || 20
            }
            break

          case 'transferCall':
            toolConfig = {
              ...toolConfig,
              destinations: tool.destinations || []
            }
            break

          case 'function':
            toolConfig = {
              ...toolConfig,
              function: tool.function || {
                name: tool.name,
                description: tool.description,
                parameters: {
                  type: 'object',
                  properties: {},
                  required: []
                }
              }
            }
            break

          case 'voicemail':
            toolConfig = {
              ...toolConfig,
              message: tool.message || ''
            }
            break

          case 'endCall':
            // End call tool doesn't need additional configuration
            break

          default:
            console.warn(`Unknown tool type: ${tool.type}`)
        }

        // Create or update the tool
        let vapiTool
        if (tool.id) {
          // Update existing tool
          vapiTool = await vapi.tools.update(tool.id, toolConfig)
          console.log(`✅ Updated VAPI tool: ${vapiTool.id}`)
        } else {
          // Create new tool
          vapiTool = await vapi.tools.create(toolConfig)
          console.log(`✅ Created VAPI tool: ${vapiTool.id}`)
        }

        results.push({
          success: true,
          tool: {
            id: vapiTool.id,
            name: vapiTool.name,
            description: vapiTool.description,
            type: vapiTool.type
          }
        })

      } catch (toolError: any) {
        console.error(`❌ Error processing tool ${tool.name}:`, toolError)
        results.push({
          success: false,
          tool: tool.name,
          error: toolError.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${tools.length} tools`
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error creating/updating tools:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process tools',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { toolId, tool }: { toolId: string; tool: Partial<VapiTool> } = await request.json()

    if (!toolId) {
      return NextResponse.json(
        { error: 'Tool ID is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log(`🔄 Updating VAPI tool: ${toolId}`)

    // Build tool configuration
    let toolConfig: any = {
      name: tool.name,
      description: tool.description,
      type: tool.type
    }

    // Add type-specific configuration
    switch (tool.type) {
      case 'apiRequest':
        toolConfig = {
          ...toolConfig,
          method: tool.method,
          url: tool.url,
          headers: tool.headers,
          body: tool.body,
          timeoutSeconds: tool.timeoutSeconds
        }
        break

      case 'transferCall':
        toolConfig = {
          ...toolConfig,
          destinations: tool.destinations
        }
        break

      case 'function':
        toolConfig = {
          ...toolConfig,
          function: tool.function
        }
        break

      case 'voicemail':
        toolConfig = {
          ...toolConfig,
          message: tool.message
        }
        break
    }

    // Update the tool using VAPI SDK
    const updatedTool = await vapi.tools.update(toolId, toolConfig)

    console.log(`✅ VAPI tool updated: ${toolId}`)

    return NextResponse.json({
      success: true,
      tool: {
        id: updatedTool.id,
        name: updatedTool.name,
        description: updatedTool.description,
        type: updatedTool.type,
        updatedAt: updatedTool.updatedAt
      }
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error updating VAPI tool:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update tool',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { toolId } = await request.json()

    if (!toolId) {
      return NextResponse.json(
        { error: 'Tool ID is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log(`🗑️ Deleting VAPI tool: ${toolId}`)

    // Delete the tool using VAPI SDK
    await vapi.tools.delete(toolId)

    console.log(`✅ VAPI tool deleted: ${toolId}`)

    return NextResponse.json({
      success: true,
      message: 'Tool deleted successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error deleting VAPI tool:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete tool',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
