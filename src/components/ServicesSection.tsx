"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ServicesSection() {
  const services = [
    {
      title: "E-commerce Growth",
      description: "Performance marketing strategies that drive traffic, increase conversions, and maximize revenue for online stores.",
      features: ["Conversion Rate Optimization", "Shopping Ads", "Retargeting Campaigns", "Customer Journey Analysis"]
    },
    {
      title: "Lead Generation",
      description: "Data-driven campaigns that attract high-quality leads and nurture them through your sales funnel efficiently.",
      features: ["Targeted Lead Ads", "Landing Page Optimization", "Marketing Automation", "Lead Scoring"]
    },
    {
      title: "Brand Performance",
      description: "Strategic campaigns that build brand awareness while driving measurable business results and ROI.",
      features: ["Performance Branding", "Attribution Modeling", "Cross-Channel Campaigns", "Competitive Analysis"]
    }
  ];

  return (
    <section id="services" className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center px-4 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4 mx-auto">
            <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
            CASE STUDIES
          </div>
          <h2 className="text-3xl font-bold tracking-tighter mb-4">Our Proven Results</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We combine data-driven strategy with creative execution to deliver performance marketing campaigns that drive measurable business growth and ROI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="p-6">
              <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
              <p className="text-muted-foreground mb-6">{service.description}</p>
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-3" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" asChild className="w-full">
                <Link href="/contact">Get Started</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}