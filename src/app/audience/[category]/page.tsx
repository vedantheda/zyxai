"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FAQSection } from "@/components/FAQSection";
import { CTASection } from "@/components/CTASection";
import { useParams } from "next/navigation";

export default function AudienceCategoryPage() {
  const params = useParams();
  const category = params.category as string;

  // Define content for each audience category
  const categoryContent = {
    "brands": {
      title: "For Established Brands",
      subtitle: "Elevate Your Performance with Data-Driven Marketing",
      description: "Established brands need to constantly optimize their marketing to maintain market share. Our performance marketing strategies help you maximize ROI while reaching new audiences.",
      features: [
        "Brand Performance Campaigns",
        "Advanced Attribution Modeling",
        "Cross-Channel Optimization",
        "Competitive Share of Voice Analysis"
      ],
      caseStudies: [
        {
          title: "Global Lifestyle Brand",
          description: "Increased ROAS by 127% with performance-focused paid social campaigns",
          image: "bg-gradient-to-br from-orange-500 to-orange-600"
        },
        {
          title: "Luxury Retail Chain",
          description: "Generated $4.2M in attributed revenue with optimized search campaigns",
          image: "bg-gradient-to-br from-orange-600 to-orange-700"
        }
      ]
    },
    "startups": {
      title: "For Startups & Scaleups",
      subtitle: "Accelerate Growth with Performance Marketing",
      description: "New businesses need efficient customer acquisition to scale quickly. Our performance marketing strategies help you acquire customers profitably from day one.",
      features: [
        "Customer Acquisition Strategy",
        "Growth Marketing Campaigns",
        "CAC Optimization",
        "Scalable Channel Development"
      ],
      caseStudies: [
        {
          title: "Tech Startup Launch",
          description: "Achieved 300% of growth targets with efficient lead generation campaigns",
          image: "bg-gradient-to-br from-orange-500 to-orange-600"
        },
        {
          title: "D2C Brand Scaling",
          description: "Scaled from $10K to $100K monthly ad spend while maintaining 3.2x ROAS",
          image: "bg-gradient-to-br from-orange-600 to-orange-700"
        }
      ]
    },
    "agencies": {
      title: "For Marketing Agencies",
      subtitle: "Extend Your Performance Marketing Capabilities",
      description: "Partner with us to expand your service offerings and deliver exceptional performance marketing to your clients without expanding your in-house team.",
      features: [
        "White-Label Performance Services",
        "Collaborative Campaign Management",
        "Flexible Resource Scaling",
        "Specialized Platform Expertise"
      ],
      caseStudies: [
        {
          title: "Agency Partnership",
          description: "Delivered 12 client campaigns with 42% average improvement in ROAS",
          image: "bg-gradient-to-br from-orange-500 to-orange-600"
        },
        {
          title: "Performance Overflow",
          description: "Provided specialized campaign management during peak demand periods",
          image: "bg-gradient-to-br from-orange-600 to-orange-700"
        }
      ]
    }
  };

  // Default content if category doesn't match
  const defaultContent = {
    title: "Custom Performance Solutions",
    subtitle: "Tailored Marketing for Your Unique Needs",
    description: "Whatever your industry or audience, we create custom performance marketing solutions that drive measurable results and ROI.",
    features: [
      "Customized Performance Strategy",
      "Industry-Specific Targeting",
      "Data-Driven Campaign Optimization",
      "ROI-Focused Measurement"
    ],
    caseStudies: [
      {
        title: "Custom Performance Solution",
        description: "Tailored approach delivering 3.5x ROAS for unique industry requirements",
        image: "bg-gradient-to-br from-orange-500 to-orange-600"
      },
      {
        title: "Specialized Performance Campaign",
        description: "Targeted marketing delivering 42% reduction in CPA for niche audience segments",
        image: "bg-gradient-to-br from-orange-600 to-orange-700"
      }
    ]
  };

  // Get content based on category or use default
  const content = categoryContent[category as keyof typeof categoryContent] || defaultContent;

  return (
    <main>
      {/* Hero Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="badge mb-6">Notch Creative Solutions</div>
            <h1 className="mb-6">
              <span className="block">{content.title}</span>
              <span className="block text-gradient">{content.subtitle}</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              {content.description}
            </p>
            <Button asChild size="lg">
              <Link href="/contact">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What We Offer</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our specialized services for {category} include:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {content.features.map((feature, index) => (
              <div key={index} className="bg-card p-6 rounded-xl border border-border/50">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">{index + 1}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{feature}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how we've helped other {category} achieve remarkable results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {content.caseStudies.map((study, index) => (
              <div key={index} className="bg-card rounded-xl overflow-hidden border border-border/50">
                <div className={`h-40 ${study.image}`}></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{study.title}</h3>
                  <p className="text-muted-foreground">{study.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection />
    </main>
  );
}
