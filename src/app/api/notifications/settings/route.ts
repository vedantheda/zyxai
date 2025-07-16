import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'demo-user-123'

    console.log(`⚙️ Fetching notification settings for user: ${userId}`)

    const { data: settings, error } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    // If no settings exist, return default settings
    if (!settings) {
      const defaultSettings = {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        inAppNotifications: true,
        callNotifications: true,
        leadNotifications: true,
        billingNotifications: true,
        systemNotifications: true,
        campaignNotifications: true,
        workflowNotifications: true,
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        },
        frequency: 'immediate'
      }

      return NextResponse.json({
        success: true,
        settings: defaultSettings
      }, { headers: corsHeaders })
    }

    return NextResponse.json({
      success: true,
      settings: settings.preferences
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error fetching notification settings:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch notification settings',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()
    const userId = 'demo-user-123' // In real app, get from auth

    console.log('⚙️ Saving notification settings for user:', userId)

    // Check if settings already exist
    const { data: existingSettings } = await supabaseAdmin
      .from('notification_settings')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingSettings) {
      // Update existing settings
      const { data: updatedSettings, error } = await supabaseAdmin
        .from('notification_settings')
        .update({
          preferences: settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Notification settings updated')

      return NextResponse.json({
        success: true,
        settings: updatedSettings.preferences,
        message: 'Notification settings updated successfully'
      }, { headers: corsHeaders })

    } else {
      // Create new settings
      const { data: newSettings, error } = await supabaseAdmin
        .from('notification_settings')
        .insert({
          user_id: userId,
          preferences: settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Notification settings created')

      return NextResponse.json({
        success: true,
        settings: newSettings.preferences,
        message: 'Notification settings created successfully'
      }, { headers: corsHeaders })
    }

  } catch (error: any) {
    console.error('❌ Error saving notification settings:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to save notification settings',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { setting, value } = await request.json()
    const userId = 'demo-user-123' // In real app, get from auth

    console.log(`⚙️ Updating notification setting: ${setting} = ${value}`)

    // Get current settings
    const { data: currentSettings } = await supabaseAdmin
      .from('notification_settings')
      .select('preferences')
      .eq('user_id', userId)
      .single()

    const updatedPreferences = {
      ...(currentSettings?.preferences || {}),
      [setting]: value
    }

    // Update the specific setting
    const { data: updatedSettings, error } = await supabaseAdmin
      .from('notification_settings')
      .upsert({
        user_id: userId,
        preferences: updatedPreferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    console.log(`✅ Notification setting updated: ${setting}`)

    return NextResponse.json({
      success: true,
      settings: updatedSettings.preferences,
      message: `${setting} updated successfully`
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error updating notification setting:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update notification setting',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
