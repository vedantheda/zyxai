import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

// Create Supabase client for server-side operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    const body = await request.json()
    const { action, data } = body

    // Get user from authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    }

    switch (action) {
      case 'save_session':
        return await saveOnboardingSession(user.id, data, headers)
      case 'get_session':
        return await getOnboardingSession(user.id, headers)
      case 'complete_onboarding':
        return await completeOnboarding(user.id, data, headers)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers })
    }
  } catch (error) {
    console.error('Onboarding API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function saveOnboardingSession(userId: string, sessionData: any, headers: any) {
  try {
    // Check if session exists
    const { data: existingSession } = await supabase
      .from('onboarding_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .single()

    if (existingSession) {
      // Update existing session
      const { data, error } = await supabase
        .from('onboarding_sessions')
        .update({
          current_step: sessionData.currentStep,
          completed_steps: sessionData.completedSteps,
          form_data: sessionData.formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSession.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, session: data }, { headers })
    } else {
      // Create new session
      const { data, error } = await supabase
        .from('onboarding_sessions')
        .insert({
          user_id: userId,
          current_step: sessionData.currentStep,
          completed_steps: sessionData.completedSteps,
          form_data: sessionData.formData,
          status: 'in_progress',
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, session: data }, { headers })
    }
  } catch (error) {
    console.error('Error saving session:', error)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500, headers })
  }
}

async function getOnboardingSession(userId: string, headers: any) {
  try {
    const { data, error } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({ success: true, session: data }, { headers })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500, headers })
  }
}

async function completeOnboarding(userId: string, completionData: any, headers: any) {
  try {
    const { sessionId, finalData } = completionData

    // Get the onboarding session
    const { data: session, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404, headers })
    }

    // Extract basic client info from form data
    const basicInfo = finalData['basic-info'] || {}
    const serviceSelection = finalData['service-selection'] || {}

    // Create client record
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        name: `${basicInfo.firstName || ''} ${basicInfo.lastName || ''}`.trim(),
        email: basicInfo.primaryEmail || '',
        phone: basicInfo.cellPhone || basicInfo.homePhone || '',
        type: 'individual',
        status: 'active',
        priority: 'medium',
        progress: 0,
        documents_count: 0,
        last_activity: new Date().toISOString(),
      })
      .select()
      .single()

    if (clientError) {
      console.error('Client creation error:', clientError)
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500, headers })
    }

    // Create detailed intake data record
    const { error: intakeError } = await supabase
      .from('client_intake_data')
      .insert({
        client_id: client.id,
        user_id: userId,
        legal_first_name: basicInfo.firstName,
        legal_last_name: basicInfo.lastName,
        middle_name: basicInfo.middleName,
        preferred_name: basicInfo.preferredName,
        name_suffix: basicInfo.nameSuffix,
        previous_names: basicInfo.previousNames,
        ssn: basicInfo.ssn,
        date_of_birth: basicInfo.dateOfBirth,
        place_of_birth: basicInfo.placeOfBirth,
        citizenship_status: basicInfo.citizenshipStatus,
        drivers_license_number: basicInfo.driversLicenseNumber,
        drivers_license_state: basicInfo.driversLicenseState,
        passport_number: basicInfo.passportNumber,
        primary_email: basicInfo.primaryEmail,
        secondary_email: basicInfo.secondaryEmail,
        home_phone: basicInfo.homePhone,
        cell_phone: basicInfo.cellPhone,
        work_phone: basicInfo.workPhone,
        emergency_contact_name: basicInfo.emergencyContactName,
        emergency_contact_phone: basicInfo.emergencyContactPhone,
        preferred_contact_method: basicInfo.preferredContactMethod,
        best_contact_time: basicInfo.bestContactTime,
        time_zone: basicInfo.timeZone,
        current_address: basicInfo.currentAddress,
        mailing_address: basicInfo.mailingAddress,
        spouse_info: finalData['spouse-info'],
        dependents: finalData['dependents'],
        employment_info: finalData['employment'],
        self_employment_info: finalData['employment']?.selfEmployment,
        income_sources: finalData['income-sources'],
        deductions_credits: finalData['deductions'],
        life_changes: finalData['life-changes'],
        service_level: serviceSelection.serviceLevel,
        service_preferences: serviceSelection.preferences,
      })

    if (intakeError) {
      console.error('Intake data error:', intakeError)
      // Don't fail the whole process, just log the error
    }

    // Mark onboarding session as completed
    await supabase
      .from('onboarding_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        client_id: client.id,
      })
      .eq('id', sessionId)

    return NextResponse.json({
      success: true,
      client,
      message: 'Onboarding completed successfully!'
    }, { headers })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500, headers })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Add CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Get user from authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    }

    return await getOnboardingSession(user.id, headers)
  } catch (error) {
    console.error('Onboarding API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
