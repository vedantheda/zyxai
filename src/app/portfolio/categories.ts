// Portfolio categories and items

// Define the types
export interface PortfolioItem {
  id: string;
  title: string;
  client: string;
  year: string;
  category: string;
  tags: string[];
  description: string;
  challenge: string;
  solution: string;
  results: string[];
  images: {
    src: string;
    alt: string;
  }[];
  videoUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// Define categories
export const categories: Category[] = [
  {
    id: 'paid-search',
    name: 'Paid Search',
    description: 'Data-driven PPC campaigns that drive high-intent traffic and conversions.',
    icon: 'search'
  },
  {
    id: 'paid-social',
    name: 'Paid Social',
    description: 'Targeted social media advertising that reaches your ideal audience with precision.',
    icon: 'share'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Performance marketing strategies that drive traffic, conversions, and revenue for online stores.',
    icon: 'shopping-cart'
  },
  {
    id: 'lead-generation',
    name: 'Lead Generation',
    description: 'Campaigns designed to capture high-quality leads and nurture them through your sales funnel.',
    icon: 'users'
  },
  {
    id: 'performance-content',
    name: 'Performance Content',
    description: 'Scroll-stopping content designed specifically to drive measurable actions and business results.',
    icon: 'video'
  }
];

// Define portfolio items
export const portfolioItems: PortfolioItem[] = [
  {
    id: 'ecommerce-growth-campaign',
    title: 'E-commerce Growth Campaign',
    client: 'Urban Lifestyle Co.',
    year: '2023',
    category: 'ecommerce',
    tags: ['E-commerce', 'Shopping Ads', 'ROAS'],
    description: 'A comprehensive performance marketing campaign for a fashion e-commerce brand that significantly increased revenue and ROAS.',
    challenge: 'The brand was experiencing declining ROAS and struggling to scale their ad spend profitably in an increasingly competitive market.',
    solution: 'We implemented a full-funnel strategy with optimized shopping ads, dynamic retargeting, and performance-focused creative that captured attention in the first 0.5 seconds.',
    results: [
      '3.8x ROAS (up from 1.9x)',
      '127% increase in revenue year-over-year',
      '42% reduction in customer acquisition cost'
    ],
    images: [
      {
        src: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b',
        alt: 'E-commerce Campaign Dashboard'
      },
      {
        src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
        alt: 'Ad Creative Examples'
      }
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'saas-lead-generation',
    title: 'SaaS Lead Generation',
    client: 'Quantum AI',
    year: '2023',
    category: 'lead-generation',
    tags: ['B2B', 'Lead Generation', 'LinkedIn Ads'],
    description: 'A targeted lead generation campaign for a B2B SaaS company that delivered high-quality leads at scale.',
    challenge: 'The company needed to generate enterprise-level leads for their AI platform while maintaining a target cost-per-lead of under $200.',
    solution: 'We developed a multi-channel lead generation strategy focused on LinkedIn and Google, with highly targeted messaging and optimized landing pages.',
    results: [
      '187 qualified leads generated in first quarter',
      '$142 average cost-per-lead (29% below target)',
      '18% lead-to-demo conversion rate'
    ],
    images: [
      {
        src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
        alt: 'Lead Generation Dashboard'
      },
      {
        src: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1',
        alt: 'Campaign Landing Page'
      }
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'search-campaign-optimization',
    title: 'Search Campaign Overhaul',
    client: 'Premium Home Services',
    year: '2023',
    category: 'paid-search',
    tags: ['Google Ads', 'Local Services', 'Conversion Optimization'],
    description: 'A complete restructuring and optimization of Google Ads campaigns for a home services company that dramatically improved performance.',
    challenge: 'The client was spending $50,000/month on Google Ads with declining results and no clear attribution of which keywords were driving actual business.',
    solution: 'We rebuilt their account structure, implemented proper conversion tracking, and developed a keyword strategy focused on high-intent searches with optimized ad copy.',
    results: [
      '215% increase in qualified leads',
      '43% reduction in cost-per-lead',
      '$4.2M in attributed revenue (5.2x ROAS)'
    ],
    images: [
      {
        src: 'https://images.unsplash.com/photo-1581287053822-fd7bf4f4bfec',
        alt: 'Search Campaign Dashboard'
      },
      {
        src: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
        alt: 'Performance Analytics'
      }
    ]
  },
  {
    id: 'social-media-scaling',
    title: 'Social Media Scaling Strategy',
    client: 'Fitness Lifestyle Brand',
    year: '2023',
    category: 'paid-social',
    tags: ['Facebook Ads', 'Instagram', 'TikTok'],
    description: 'A multi-platform social media advertising strategy that helped a fitness brand scale from $10K to $100K monthly ad spend profitably.',
    challenge: 'The brand had found success with small-scale social media advertising but struggled to maintain performance when increasing budget.',
    solution: 'We implemented a comprehensive scaling strategy with audience expansion, creative testing framework, and platform diversification across Facebook, Instagram, and TikTok.',
    results: [
      'Successfully scaled from $10K to $100K monthly spend while maintaining ROAS',
      '3.2x average ROAS across all platforms',
      '285% increase in monthly revenue'
    ],
    images: [
      {
        src: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868',
        alt: 'Social Media Campaign Dashboard'
      },
      {
        src: 'https://images.unsplash.com/photo-1579869847514-7c1a19d2d2ad',
        alt: 'Ad Creative Examples'
      }
    ]
  },
  {
    id: 'performance-video-campaign',
    title: 'Performance Video Campaign',
    client: 'Subscription Box Service',
    year: '2023',
    category: 'performance-content',
    tags: ['Video Ads', 'Creative Testing', 'Conversion Optimization'],
    description: 'A data-driven video campaign that significantly improved conversion rates and reduced customer acquisition costs.',
    challenge: 'The client\'s existing video content was visually appealing but failed to drive conversions, resulting in high CPAs across channels.',
    solution: 'We developed a testing framework for performance-focused video content that captured attention in the first 0.5 seconds and drove specific user actions.',
    results: [
      '67% improvement in conversion rate',
      '52% reduction in cost-per-acquisition',
      '4.1x ROAS (up from 1.8x)'
    ],
    images: [
      {
        src: 'https://images.unsplash.com/photo-1626785774573-4b799315345d',
        alt: 'Video Campaign Analytics'
      },
      {
        src: 'https://images.unsplash.com/photo-1574717024453-354056afd6fc',
        alt: 'Video Production'
      }
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'cross-channel-campaign',
    title: 'Cross-Channel Campaign',
    client: 'Travel Experience Platform',
    year: '2023',
    category: 'paid-social',
    tags: ['Multi-Channel', 'Attribution', 'Customer Journey'],
    description: 'An integrated cross-channel campaign that effectively targeted users throughout their customer journey.',
    challenge: 'The client was running siloed campaigns across multiple platforms with inconsistent messaging and no clear understanding of the customer journey.',
    solution: 'We developed a cohesive cross-channel strategy with consistent messaging adapted for each platform\'s strengths, supported by proper attribution modeling.',
    results: [
      '32% increase in overall conversion rate',
      '28% reduction in blended customer acquisition cost',
      '3.7x ROAS across all channels'
    ],
    images: [
      {
        src: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f5a07d',
        alt: 'Cross-Channel Dashboard'
      },
      {
        src: 'https://images.unsplash.com/photo-1563986768609-322da13575f3',
        alt: 'Customer Journey Map'
      }
    ]
  }
];

// Helper function to get items by category
export function getItemsByCategory(categoryId: string): PortfolioItem[] {
  return portfolioItems.filter(item => item.category === categoryId);
}

// Helper function to get a specific item by ID
export function getItemById(id: string): PortfolioItem | undefined {
  return portfolioItems.find(item => item.id === id);
}

// Helper function to get related items (same category, excluding the current item)
export function getRelatedItems(id: string, limit: number = 3): PortfolioItem[] {
  const currentItem = getItemById(id);
  if (!currentItem) return [];

  return portfolioItems
    .filter(item => item.category === currentItem.category && item.id !== id)
    .slice(0, limit);
}
