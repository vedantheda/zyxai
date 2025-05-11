"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ServicesSection() {
  const services = [
    {
      title: "Website Design",
      description: "Beautiful, responsive websites that engage visitors and convert them into customers.",
      features: ["Custom UI/UX Design", "Responsive Layout", "Mobile-first Approach", "Brand Integration"]
    },
    {
      title: "Web Development",
      description: "High-performance websites built with modern technologies for optimal user experience.",
      features: ["Next.js Development", "E-commerce Solutions", "CMS Integration", "Performance Optimization"]
    },
    {
      title: "Brand Strategy",
      description: "Comprehensive brand strategies that help you stand out in your market.",
      features: ["Brand Identity", "Market Research", "Positioning Strategy", "Visual Guidelines"]
    }
  ];

  return (
    <section id="services" className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter mb-4">Featured Services</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We specialize in creating exceptional digital experiences that drive business growth.
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