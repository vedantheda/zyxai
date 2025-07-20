import { HubSpotDeal, HubSpotPipeline, HubSpotStage } from '@/lib/services/HubSpotDealsService'

// Our opportunity interface
export interface Opportunity {
  id: string
  name: string
  amount: number
  currency: string
  stage: {
    id: string
    name: string
    probability: number
    color: string
    isClosedWon?: boolean
    isClosedLost?: boolean
  }
  pipeline: {
    id: string
    name: string
  }
  contact: {
    id: string
    name: string
    email: string
    company?: string
  }
  owner: {
    id: string
    name: string
    email: string
  }
  closeDate: string
  probability: number
  source: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  createdAt: string
  updatedAt: string
  hubspotId?: string
  description?: string
}

// Stage color mapping based on probability
const getStageColor = (probability: number): string => {
  if (probability >= 90) return '#10b981' // green
  if (probability >= 70) return '#f59e0b' // amber
  if (probability >= 50) return '#3b82f6' // blue
  if (probability >= 25) return '#8b5cf6' // purple
  return '#6b7280' // gray
}

// Priority mapping from HubSpot priority
const mapPriority = (hubspotPriority?: string): 'low' | 'medium' | 'high' | 'urgent' => {
  switch (hubspotPriority?.toLowerCase()) {
    case 'high':
      return 'high'
    case 'urgent':
      return 'urgent'
    case 'low':
      return 'low'
    default:
      return 'medium'
  }
}

// Check if stage is closed won/lost
const isClosedWon = (stageName: string): boolean => {
  return stageName.toLowerCase().includes('closed') && stageName.toLowerCase().includes('won')
}

const isClosedLost = (stageName: string): boolean => {
  return stageName.toLowerCase().includes('closed') && stageName.toLowerCase().includes('lost')
}

/**
 * Map HubSpot deal to our Opportunity interface
 */
export const mapHubSpotDealToOpportunity = (
  deal: HubSpotDeal,
  contacts: Record<string, any> = {},
  owners: Record<string, any> = {},
  pipelines: HubSpotPipeline[] = []
): Opportunity => {
  // Get associated contact
  const contactId = deal.associations?.contacts?.[0]?.id || ''
  const contact = contacts[contactId] || {
    id: contactId,
    name: 'Unknown Contact',
    email: '',
    company: ''
  }

  // Get owner
  const ownerId = deal.properties.hubspot_owner_id || ''
  const owner = owners[ownerId] || {
    id: ownerId,
    name: 'Unassigned',
    email: ''
  }

  // Get pipeline info
  const pipelineId = deal.properties.pipeline || 'default'
  const pipeline = pipelines.find(p => p.id === pipelineId) || {
    id: pipelineId,
    label: 'Sales Pipeline'
  }

  // Get stage info
  const stageId = deal.properties.dealstage || ''
  const stage = pipeline.stages?.find(s => s.id === stageId)
  const stageProbability = stage?.probability || parseFloat(deal.properties.probability || '0')

  // Parse amount
  const amount = parseFloat(deal.properties.amount || '0')

  return {
    id: deal.id,
    name: deal.properties.dealname || 'Untitled Deal',
    amount,
    currency: 'USD', // HubSpot deals are typically in USD, could be enhanced
    stage: {
      id: stageId,
      name: stage?.label || deal.properties.dealstage || 'Unknown Stage',
      probability: stageProbability,
      color: getStageColor(stageProbability),
      isClosedWon: stage ? isClosedWon(stage.label) : false,
      isClosedLost: stage ? isClosedLost(stage.label) : false
    },
    pipeline: {
      id: pipelineId,
      name: pipeline.label || 'Sales Pipeline'
    },
    contact: {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      company: contact.company
    },
    owner: {
      id: owner.id,
      name: owner.name,
      email: owner.email
    },
    closeDate: deal.properties.closedate || new Date().toISOString(),
    probability: stageProbability,
    source: deal.properties.lead_source || 'Unknown',
    priority: mapPriority(deal.properties.hs_priority),
    tags: [], // HubSpot doesn't have built-in tags, could use custom properties
    createdAt: deal.properties.createdate || new Date().toISOString(),
    updatedAt: deal.properties.hs_lastmodifieddate || new Date().toISOString(),
    hubspotId: deal.id,
    description: deal.properties.description || ''
  }
}

/**
 * Map multiple HubSpot deals to opportunities
 */
export const mapHubSpotDealsToOpportunities = (
  deals: HubSpotDeal[],
  contacts: Record<string, any> = {},
  owners: Record<string, any> = {},
  pipelines: HubSpotPipeline[] = []
): Opportunity[] => {
  return deals.map(deal => mapHubSpotDealToOpportunity(deal, contacts, owners, pipelines))
}

/**
 * Map HubSpot pipeline to our pipeline interface
 */
export const mapHubSpotPipelineToLocal = (hubspotPipeline: HubSpotPipeline) => {
  return {
    id: hubspotPipeline.id,
    name: hubspotPipeline.label,
    stages: hubspotPipeline.stages?.map(stage => ({
      id: stage.id,
      name: stage.label,
      probability: stage.probability,
      color: getStageColor(stage.probability),
      order: stage.displayOrder,
      isClosedWon: isClosedWon(stage.label),
      isClosedLost: isClosedLost(stage.label)
    })) || [],
    isDefault: hubspotPipeline.displayOrder === 0
  }
}

/**
 * Map our opportunity back to HubSpot deal format for updates
 */
export const mapOpportunityToHubSpotDeal = (opportunity: Opportunity): Partial<HubSpotDeal['properties']> => {
  return {
    dealname: opportunity.name,
    amount: opportunity.amount.toString(),
    dealstage: opportunity.stage.id,
    pipeline: opportunity.pipeline.id,
    closedate: opportunity.closeDate,
    probability: opportunity.probability.toString(),
    description: opportunity.description || '',
    hs_priority: opportunity.priority,
    lead_source: opportunity.source,
    hubspot_owner_id: opportunity.owner.id
  }
}

/**
 * Extract unique contact IDs from deals
 */
export const extractContactIdsFromDeals = (deals: HubSpotDeal[]): string[] => {
  const contactIds = new Set<string>()
  
  deals.forEach(deal => {
    deal.associations?.contacts?.forEach(contact => {
      if (contact.id) {
        contactIds.add(contact.id)
      }
    })
  })
  
  return Array.from(contactIds)
}

/**
 * Extract unique owner IDs from deals
 */
export const extractOwnerIdsFromDeals = (deals: HubSpotDeal[]): string[] => {
  const ownerIds = new Set<string>()
  
  deals.forEach(deal => {
    if (deal.properties.hubspot_owner_id) {
      ownerIds.add(deal.properties.hubspot_owner_id)
    }
  })
  
  return Array.from(ownerIds)
}
