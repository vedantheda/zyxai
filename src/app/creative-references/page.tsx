"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/CTASection";

export default function CreativeReferencesPage() {
  const creativeReferences = [
    {
      category: "Video Production",
      references: [
        {
          title: "Apple - Shot on iPhone",
          description: "Apple's 'Shot on iPhone' campaigns are masterclasses in showcasing product capabilities through user-generated content. The simplicity and focus on stunning visuals make viewers stop scrolling.",
          url: "https://www.apple.com/iphone/photography/",
          imageUrl: "https://images.unsplash.com/photo-1592286927505-1def25115558"
        },
        {
          title: "Nike - Dream Crazy",
          description: "Nike's 'Dream Crazy' campaign featuring Colin Kaepernick demonstrates how taking a bold stance can create scroll-stopping content that resonates with your audience's values.",
          url: "https://news.nike.com/featured_video/nike-dream-crazy",
          imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
        },
        {
          title: "Wistia - One, Ten, One Hundred",
          description: "Wistia's documentary explores how budget affects creativity by producing the same ad at three different price points. It's a great reference for creating compelling content at any budget level.",
          url: "https://wistia.com/series/one-ten-one-hundred",
          imageUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4"
        }
      ]
    },
    {
      category: "Social Media Content",
      references: [
        {
          title: "Duolingo - TikTok Strategy",
          description: "Duolingo's approach to TikTok with their owl mascot creating trend-based content is a perfect example of how brands can create scroll-stopping content by embracing platform-specific humor.",
          url: "https://www.tiktok.com/@duolingo",
          imageUrl: "https://images.unsplash.com/photo-1611162616475-46b635cb6868"
        },
        {
          title: "Spotify - Wrapped",
          description: "Spotify's annual 'Wrapped' campaign turns user data into highly shareable, personalized content that users can't help but engage with and share.",
          url: "https://spotify.com/wrapped",
          imageUrl: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff"
        },
        {
          title: "Glossier - User-Generated Content",
          description: "Glossier's strategy of featuring real customers using their products creates authentic content that resonates with their audience and stops the scroll.",
          url: "https://www.instagram.com/glossier/",
          imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348"
        }
      ]
    },
    {
      category: "Brand Storytelling",
      references: [
        {
          title: "Patagonia - Environmental Activism",
          description: "Patagonia's commitment to environmental causes is woven into all their content, creating a consistent brand narrative that resonates with their audience's values.",
          url: "https://www.patagonia.com/stories/",
          imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf"
        },
        {
          title: "Airbnb - Belong Anywhere",
          description: "Airbnb's 'Belong Anywhere' campaign tells emotional stories about connection and belonging that transcend typical travel content.",
          url: "https://www.airbnb.com/belong-anywhere",
          imageUrl: "https://images.unsplash.com/photo-1505873242700-f289a29e1e0f"
        },
        {
          title: "Dove - Real Beauty",
          description: "Dove's long-running 'Real Beauty' campaign challenges beauty standards with content that makes viewers pause and reflect.",
          url: "https://www.dove.com/us/en/stories/campaigns.html",
          imageUrl: "https://images.unsplash.com/photo-1522338140262-f46f5913618a"
        }
      ]
    }
  ];

  const organizationTips = [
    {
      title: "Content Categorization System",
      description: "Organize your portfolio work into clear categories based on content type (video, photography, social media) and industry/vertical (fashion, tech, food & beverage). This makes it easier for potential clients to find relevant examples.",
      steps: [
        "Create main categories based on content type (as shown in our portfolio section)",
        "Add subcategories based on industry or client type",
        "Tag content with relevant keywords for searchability",
        "Ensure each project has consistent metadata (client, year, results)"
      ]
    },
    {
      title: "Case Study Structure",
      description: "For each major project, create a structured case study that follows a consistent format to help visitors quickly understand the value you delivered.",
      steps: [
        "Start with a compelling visual (thumbnail or video)",
        "Include a clear, concise project overview",
        "Outline the challenge you were solving",
        "Explain your creative approach and solution",
        "Highlight measurable results and outcomes",
        "Add supporting visuals throughout"
      ]
    },
    {
      title: "Content Management Workflow",
      description: "Implement a systematic workflow for adding new projects to your portfolio to ensure consistency and quality.",
      steps: [
        "Create a project intake form to gather all necessary information",
        "Establish a quality checklist for images and videos",
        "Set up a review process before publishing",
        "Schedule regular portfolio audits to remove outdated work",
        "Track performance metrics for featured projects"
      ]
    },
    {
      title: "Technical Organization",
      description: "Ensure your website's technical structure supports easy navigation and discovery of your work.",
      steps: [
        "Implement filtering and sorting options",
        "Use consistent image sizes and formats",
        "Optimize video loading for performance",
        "Create a logical URL structure",
        "Ensure mobile-friendly display of all portfolio items"
      ]
    }
  ];

  return (
    <main>
      {/* Hero Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="badge mb-6">Creative Resources</div>
            <h1 className="mb-6">
              <span className="block">Creative References &</span>
              <span className="block text-gradient">Organization Tips</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Explore our curated collection of creative references and learn how to systematically organize your portfolio work for maximum impact.
            </p>
          </div>
        </div>
      </section>

      {/* Creative References Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">Creative References</h2>
          
          <div className="space-y-16">
            {creativeReferences.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-2xl font-bold mb-6">{category.category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {category.references.map((reference, refIndex) => (
                    <div key={refIndex} className="bg-card rounded-xl overflow-hidden border border-border/50">
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={reference.imageUrl} 
                          alt={reference.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <h4 className="text-xl font-bold mb-2">{reference.title}</h4>
                        <p className="text-muted-foreground mb-4">{reference.description}</p>
                        <Button asChild variant="outline" size="sm">
                          <a href={reference.url} target="_blank" rel="noopener noreferrer">
                            Explore Reference
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Organization Tips Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">Portfolio Organization Tips</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {organizationTips.map((tip, index) => (
              <div key={index} className="bg-card p-8 rounded-xl border border-border/50">
                <h3 className="text-xl font-bold mb-4">{tip.title}</h3>
                <p className="text-muted-foreground mb-6">{tip.description}</p>
                <h4 className="font-bold mb-2">Implementation Steps:</h4>
                <ul className="space-y-2">
                  {tip.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />
    </main>
  );
}
