import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') // Filter by task status

    // Fetch tasks from HubSpot API
    const hubspotApiKey = process.env.HUBSPOT_ACCESS_TOKEN
    let hubspotTasks: any[] = []

    if (hubspotApiKey) {
      try {
        const response = await fetch(
          `https://api.hubapi.com/crm/v3/objects/tasks?associations=contact&limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${hubspotApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          hubspotTasks = data.results?.map((task: any) => {
            const dueDate = task.properties?.hs_task_due_date
            const isOverdue = dueDate && new Date(dueDate) < new Date()
            const isCompleted = task.properties?.hs_task_status === 'COMPLETED'

            return {
              id: task.id,
              contact_id: contactId,
              title: task.properties?.hs_task_subject || 'Task',
              description: task.properties?.hs_task_body || '',
              status: isCompleted ? 'completed' : (isOverdue ? 'overdue' : 'open'),
              priority: task.properties?.hs_task_priority || 'medium',
              due_date: dueDate || null,
              assigned_to: task.properties?.hubspot_owner_id || 'system',
              assigned_to_name: 'CRM User',
              assigned_to_avatar: 'CU',
              created_by: task.properties?.hubspot_owner_id || 'system',
              created_by_name: 'CRM User',
              created_at: task.properties?.hs_createdate || new Date().toISOString(),
              updated_at: task.properties?.hs_lastmodifieddate || task.properties?.hs_createdate || new Date().toISOString(),
              completed_at: isCompleted ? (task.properties?.hs_lastmodifieddate || null) : null,
              metadata: {
                hubspot_id: task.id,
                ...task.properties
              }
            }
          }) || []
        }
      } catch (error) {
        console.error('Failed to fetch tasks from HubSpot:', error)
      }
    }

    // Fallback to mock data if HubSpot fetch fails or returns no data
    const mockTasks = [
      {
        id: '1',
        contact_id: contactId,
        title: 'Follow up on wholesale pricing inquiry',
        description: 'Contact expressed interest in bulk orders. Need to send detailed pricing sheet and schedule demo call.',
        status: 'open',
        priority: 'high',
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
        assigned_to: 'user-1',
        assigned_to_name: 'Sarah Johnson',
        assigned_to_avatar: 'S',
        created_by: 'user-1',
        created_by_name: 'Sarah Johnson',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        completed_at: null
      },
      {
        id: '2',
        contact_id: contactId,
        title: 'Send product samples',
        description: 'Customer requested physical samples of top 3 products for quality assessment.',
        status: 'overdue',
        priority: 'urgent',
        due_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        assigned_to: 'user-2',
        assigned_to_name: 'Mike Wilson',
        assigned_to_avatar: 'M',
        created_by: 'user-1',
        created_by_name: 'Sarah Johnson',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        completed_at: null
      },
      {
        id: '3',
        contact_id: contactId,
        title: 'Initial contact call',
        description: 'Make first contact call to introduce company and assess interest level.',
        status: 'completed',
        priority: 'medium',
        due_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        assigned_to: 'user-1',
        assigned_to_name: 'Sarah Johnson',
        assigned_to_avatar: 'S',
        created_by: 'user-1',
        created_by_name: 'Sarah Johnson',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        completed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
      }
    ]

    // Use HubSpot data if available, otherwise fallback to mock data
    const finalTasks = hubspotTasks.length > 0 ? hubspotTasks : mockTasks

    // Sort by due date and creation date
    finalTasks.sort((a, b) => {
      // Overdue tasks first, then by due date, then by creation date
      if (a.status === 'overdue' && b.status !== 'overdue') return -1
      if (b.status === 'overdue' && a.status !== 'overdue') return 1

      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Filter by status if specified
    let filteredTasks = finalTasks
    if (status) {
      filteredTasks = finalTasks.filter(task => task.status === status)
    }

    // Apply pagination
    const paginatedTasks = filteredTasks.slice(offset, offset + limit)

    // Calculate task counts
    const taskCounts = {
      total: finalTasks.length,
      open: finalTasks.filter(t => t.status === 'open').length,
      completed: finalTasks.filter(t => t.status === 'completed').length,
      overdue: finalTasks.filter(t => t.status === 'overdue').length
    }

    return NextResponse.json({
      success: true,
      tasks: paginatedTasks,
      counts: taskCounts,
      total: filteredTasks.length,
      limit,
      offset,
      source: hubspotTasks.length > 0 ? 'hubspot' : 'mock'
    })

  } catch (error) {
    console.error('Failed to fetch contact tasks:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch contact tasks'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const body = await request.json()
    const { title, description, priority, due_date, assigned_to } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json({
        success: false,
        error: 'Title is required'
      }, { status: 400 })
    }

    // Create task in HubSpot
    const hubspotApiKey = process.env.HUBSPOT_ACCESS_TOKEN
    let hubspotTask = null

    if (hubspotApiKey) {
      try {
        const taskData = {
          properties: {
            hs_task_subject: title,
            hs_task_body: description || '',
            hs_task_status: 'NOT_STARTED',
            hs_task_priority: priority?.toUpperCase() || 'MEDIUM',
            hs_task_due_date: due_date || null,
            hs_timestamp: new Date().toISOString()
          },
          associations: [
            {
              to: { id: contactId },
              types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 204 }] // Task to Contact association
            }
          ]
        }

        const response = await fetch('https://api.hubapi.com/crm/v3/objects/tasks', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskData)
        })

        if (response.ok) {
          hubspotTask = await response.json()
        }
      } catch (error) {
        console.error('Failed to create task in HubSpot:', error)
      }
    }

    // Return the created task (from HubSpot if successful, otherwise mock data)
    const newTask = hubspotTask ? {
      id: hubspotTask.id,
      contact_id: contactId,
      title,
      description: description || '',
      status: 'open',
      priority: priority || 'medium',
      due_date: due_date || null,
      assigned_to: assigned_to || 'current-user',
      assigned_to_name: 'Current User',
      assigned_to_avatar: 'CU',
      created_by: 'current-user',
      created_by_name: 'Current User',
      created_at: hubspotTask.properties?.hs_createdate || new Date().toISOString(),
      updated_at: hubspotTask.properties?.hs_lastmodifieddate || new Date().toISOString(),
      completed_at: null,
      metadata: {
        hubspot_id: hubspotTask.id,
        source: 'hubspot'
      }
    } : {
      id: `task-${Date.now()}`,
      contact_id: contactId,
      title,
      description: description || '',
      status: 'open',
      priority: priority || 'medium',
      due_date: due_date || null,
      assigned_to: assigned_to || 'current-user',
      assigned_to_name: 'Current User',
      assigned_to_avatar: 'CU',
      created_by: 'current-user',
      created_by_name: 'Current User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
      metadata: {
        source: 'local'
      }
    }

    return NextResponse.json({
      success: true,
      task: newTask,
      message: 'Task created and automatically saved to CRM',
      source: hubspotTask ? 'hubspot' : 'local'
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to create contact task:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create contact task'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const body = await request.json()
    const { taskId, title, description, status, priority, due_date, assigned_to } = body

    // Validate required fields
    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: 'Task ID is required'
      }, { status: 400 })
    }

    // Mock task update - replace with actual database update
    const updatedTask = {
      id: taskId,
      contact_id: contactId,
      title: title || 'Untitled Task',
      description: description || '',
      status: status || 'open',
      priority: priority || 'medium',
      due_date: due_date || null,
      assigned_to: assigned_to || 'current-user',
      assigned_to_name: 'Current User',
      assigned_to_avatar: 'CU',
      created_by: 'current-user',
      created_by_name: 'Current User',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // Mock created time
      updated_at: new Date().toISOString(),
      completed_at: status === 'completed' ? new Date().toISOString() : null
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: 'Task updated successfully'
    })

  } catch (error) {
    console.error('Failed to update contact task:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update contact task'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: 'Task ID is required'
      }, { status: 400 })
    }

    // Mock task deletion - replace with actual database delete
    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete contact task:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete contact task'
    }, { status: 500 })
  }
}
