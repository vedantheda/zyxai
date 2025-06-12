"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FAQSection } from "@/components/FAQSection";
import { CTASection } from "@/components/CTASection";

export default function ProcessPage() {
  const processSteps = [
    {
      number: "01",
      title: "Discovery",
      description: "We start by understanding your business, audience, and objectives. This deep dive helps us identify the performance marketing strategies that will drive the best results.",
      details: [
        "Business Model Analysis",
        "Customer Journey Mapping",
        "Competitive Landscape Review",
        "Goal Setting & KPI Definition"
      ]
    },
    {
      number: "02",
      title: "Strategy",
      description: "Based on our discoveries, we develop a tailored performance marketing strategy that aligns with your business goals and targets your ideal customers.",
      details: [
        "Channel Strategy Development",
        "Audience Targeting Plan",
        "Budget Allocation Framework",
        "Timeline & Milestone Setting"
      ]
    },
    {
      number: "03",
      title: "Campaign Setup",
      description: "Our performance team builds your campaigns with precision, implementing best practices across platforms to maximize efficiency from day one.",
      details: [
        "Account Structure Optimization",
        "Tracking Implementation",
        "Creative Development",
        "A/B Testing Framework"
      ]
    },
    {
      number: "04",
      title: "Optimization",
      description: "We continuously optimize your campaigns based on real-time data, making adjustments to improve performance and scale what's working.",
      details: [
        "Bid Management",
        "Audience Refinement",
        "Creative Iteration",
        "Budget Reallocation"
      ]
    },
    {
      number: "05",
      title: "Analysis & Reporting",
      description: "We provide transparent reporting on all KPIs, with actionable insights that drive continuous improvement and ROI growth.",
      details: [
        "Performance Dashboard",
        "Attribution Analysis",
        "ROI Calculation",
        "Strategic Recommendations"
      ]
    }
  ];

  return (
    <main>
      {/* Hero Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="badge mb-6">Our Process</div>
            <h1 className="mb-6">
              <span className="block">How We Drive</span>
              <span className="block text-gradient">Measurable Results</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Our proven process ensures we deliver performance marketing campaigns that not only capture attention but also achieve your business objectives and ROI targets.
            </p>
            <Button asChild size="lg">
              <Link href="#process">Explore Our Process</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Performance Marketing Process</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We follow a data-driven, results-focused approach to ensure consistent, high-ROI outcomes for every campaign.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {processSteps.map((step, index) => (
              <div key={index} className="mb-16 last:mb-0">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                      {step.number}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                    <p className="text-lg text-muted-foreground mb-6">{step.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {step.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {index < processSteps.length - 1 && (
                  <div className="w-px h-16 bg-border/50 mx-auto my-8"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our clients have to say about working with us.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-card p-8 rounded-xl border border-border/50 relative">
              <div className="absolute -top-4 -left-4 text-6xl text-primary/20">"</div>
              <p className="text-lg mb-6 relative z-10">
                Notch's performance marketing campaigns delivered incredible ROI. We saw our cost-per-acquisition drop by 42% and conversion rates increase by 67% within the first month.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20"></div>
                <div>
                  <h4 className="font-bold">Sarah Johnson</h4>
                  <p className="text-sm text-muted-foreground">Marketing Director, Tech Startup</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-8 rounded-xl border border-border/50 relative">
              <div className="absolute -top-4 -left-4 text-6xl text-primary/20">"</div>
              <p className="text-lg mb-6 relative z-10">
                The team at Notch understands how to create performance marketing campaigns that not only capture attention but also drive measurable ROI. They've become an extension of our marketing team.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20"></div>
                <div>
                  <h4 className="font-bold">Michael Chen</h4>
                  <p className="text-sm text-muted-foreground">E-commerce Director, Lifestyle Brand</p>
                </div>
              </div>
            </div>
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
