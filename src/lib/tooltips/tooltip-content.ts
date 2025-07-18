/**
 * Comprehensive tooltip content library for ZyxAI
 * Provides contextual help for first-time users
 */

export const TOOLTIP_CONTENT = {
  // Dashboard
  dashboard: {
    overview: "Your main dashboard showing key metrics, recent activity, and quick actions for your AI voice platform.",
    analytics: "View detailed analytics about your AI agents' performance, call success rates, and business metrics.",
    quickActions: "Common tasks you can perform quickly. Click any action to get started immediately.",
    recentActivity: "Latest events and activities in your organization, including calls, agent updates, and team changes.",
    callMetrics: "Real-time statistics about your voice calls including success rates, duration, and costs.",
    agentPerformance: "How well your AI agents are performing based on call success, customer satisfaction, and efficiency."
  },

  // AI Agents
  agents: {
    create: "Create a new AI voice agent. We recommend starting with a template for best results.",
    templates: "Pre-built agent configurations optimized for specific industries and use cases. Much faster than building from scratch.",
    voiceSettings: "Configure how your agent sounds including voice type, speed, and personality traits.",
    systemPrompt: "Instructions that define your agent's behavior, knowledge, and conversation style. This is crucial for agent performance.",
    firstMessage: "The opening message your agent will say when starting a call. Keep it friendly and professional.",
    tools: "Functions your agent can perform during calls like scheduling appointments, updating CRM, or transferring to humans.",
    testCall: "Make a demo call to test your agent before deploying it to real customers.",
    deploy: "Activate your agent so it can handle real customer calls.",
    performance: "Track how well your agent is performing with metrics like success rate, call duration, and customer feedback."
  },

  // Voice Calls
  calls: {
    makeCall: "Start a new outbound call using one of your AI agents.",
    callHistory: "View all past calls with details like duration, outcome, and conversation transcripts.",
    callStatus: "Current status of the call: connecting, in progress, completed, or failed.",
    transcript: "Real-time or recorded conversation between your agent and the customer.",
    callAnalytics: "Detailed metrics about call performance including success rate, average duration, and cost analysis.",
    callRecording: "Audio recording of the conversation (if enabled in your settings).",
    transferCall: "Hand off the call from AI agent to a human representative when needed."
  },

  // Contacts
  contacts: {
    addContact: "Add a new contact to your database for calling campaigns or individual outreach.",
    importContacts: "Upload a CSV file to add multiple contacts at once. We'll help you map the fields correctly.",
    contactTags: "Organize contacts with tags like 'hot lead', 'customer', or 'follow-up needed'.",
    callHistory: "See all previous calls made to this contact including outcomes and notes.",
    contactNotes: "Add important information about this contact for future reference.",
    contactStatus: "Current relationship status: lead, prospect, customer, or inactive.",
    bulkActions: "Perform actions on multiple contacts at once like adding tags or starting campaigns."
  },

  // Campaigns
  campaigns: {
    create: "Set up an automated calling campaign to reach multiple contacts with your AI agent.",
    schedule: "Choose when your campaign should run. Consider your contacts' time zones and preferences.",
    agentSelection: "Pick which AI agent will make the calls. Different agents work better for different purposes.",
    contactList: "Select which contacts to include in this campaign. You can filter by tags, status, or other criteria.",
    callScript: "The conversation flow your agent will follow. Templates are available for common scenarios.",
    campaignMetrics: "Track campaign performance including calls made, success rate, and conversions.",
    pauseCampaign: "Temporarily stop the campaign. You can resume it later without losing progress."
  },

  // Team Management
  team: {
    inviteUser: "Send an invitation to add a new team member to your organization.",
    userRoles: "Control what each team member can access: Owner (full access), Admin (most features), Manager (team oversight), Agent (basic access), Viewer (read-only).",
    permissions: "Specific capabilities each role has within the platform.",
    teamActivity: "Recent actions taken by team members for audit and oversight purposes.",
    removeUser: "Remove a team member's access to your organization. They'll lose all permissions immediately."
  },

  // Settings
  settings: {
    profile: "Your personal account information and preferences.",
    organization: "Company-wide settings that affect all team members.",
    billing: "Manage your subscription, view usage, and update payment methods.",
    integrations: "Connect ZyxAI with other tools like CRM systems, calendars, and communication platforms.",
    apiKeys: "Generate API keys for custom integrations and advanced automation.",
    webhooks: "Set up real-time notifications when events happen in your account.",
    security: "Two-factor authentication, session management, and security preferences."
  },

  // Phone Numbers
  phoneNumbers: {
    purchase: "Buy a new phone number for your AI agents to make calls from.",
    configure: "Set up call routing, voicemail, and other phone number settings.",
    callerId: "The number that appears when your agent calls someone. Choose a local number for better answer rates.",
    numberType: "Local numbers work best for regional businesses, toll-free for national reach."
  },

  // Workflows
  workflows: {
    create: "Build automated workflows that trigger based on events like completed calls or form submissions.",
    triggers: "Events that start your workflow: new contact, successful call, failed call, etc.",
    actions: "What happens when the workflow runs: send email, create task, update CRM, make call.",
    conditions: "Rules that determine if the workflow should continue based on data or outcomes.",
    testing: "Test your workflow with sample data before activating it for real events."
  },

  // Analytics
  analytics: {
    overview: "High-level metrics about your entire voice platform performance.",
    agentComparison: "Compare how different AI agents are performing to identify your best configurations.",
    callTrends: "Track call volume, success rates, and other metrics over time to spot patterns.",
    costAnalysis: "Monitor your spending on calls, phone numbers, and other platform features.",
    exportData: "Download your analytics data for external analysis or reporting."
  },

  // Common UI Elements
  ui: {
    save: "Save your current changes. Don't forget to save before leaving the page!",
    cancel: "Discard changes and return to the previous state.",
    delete: "Permanently remove this item. This action cannot be undone.",
    edit: "Modify the settings or information for this item.",
    refresh: "Reload the latest data from the server.",
    search: "Find specific items by typing keywords or filters.",
    filter: "Show only items that match certain criteria.",
    sort: "Change the order items are displayed in the list.",
    export: "Download data in a file format like CSV or PDF.",
    import: "Upload data from a file to add multiple items at once."
  },

  // Status Indicators
  status: {
    active: "This item is currently active and functioning normally.",
    inactive: "This item is disabled and not currently in use.",
    pending: "This action is waiting to be processed or completed.",
    completed: "This task or process has finished successfully.",
    failed: "This action encountered an error and did not complete.",
    processing: "This item is currently being worked on by the system.",
    draft: "This is a saved but not yet activated configuration."
  },

  // First-time User Tips
  tips: {
    gettingStarted: [
      "Start with the onboarding guide to set up your first AI agent",
      "Use templates instead of building agents from scratch",
      "Test your agents with demo calls before going live",
      "Import your contacts to get started with campaigns quickly"
    ],
    bestPractices: [
      "Keep agent instructions clear and specific",
      "Use local phone numbers for better answer rates",
      "Monitor call analytics to improve performance",
      "Set up proper team permissions for security"
    ],
    troubleshooting: [
      "Check your internet connection if calls aren't connecting",
      "Verify phone number settings if calls aren't going through",
      "Review agent logs if conversations aren't flowing well",
      "Contact support if you encounter persistent issues"
    ]
  }
} as const

/**
 * Get tooltip content by path
 */
export function getTooltipContent(path: string): string {
  const keys = path.split('.')
  let content: any = TOOLTIP_CONTENT
  
  for (const key of keys) {
    content = content?.[key]
    if (!content) break
  }
  
  return typeof content === 'string' ? content : 'No help available for this feature.'
}

/**
 * Get tips for a specific category
 */
export function getTips(category: keyof typeof TOOLTIP_CONTENT.tips): string[] {
  return TOOLTIP_CONTENT.tips[category] || []
}
