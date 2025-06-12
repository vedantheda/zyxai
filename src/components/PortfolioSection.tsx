"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PortfolioSection() {
  const portfolioItems = [
    {
      title: "Lifestyle Brand Campaign",
      category: "Video Production",
      image: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
    {
      title: "Tech Startup Launch",
      category: "Social Media Content",
      image: "bg-gradient-to-br from-orange-600 to-orange-700"
    },
    {
      title: "Food & Beverage Series",
      category: "Photography",
      image: "bg-gradient-to-br from-orange-700 to-orange-800"
    },
    {
      title: "Fashion Lookbook",
      category: "Creative Direction",
      image: "bg-gradient-to-br from-orange-500 to-orange-700"
    },
    {
      title: "Product Launch Campaign",
      category: "Integrated Marketing",
      image: "bg-gradient-to-br from-orange-600 to-orange-800"
    },
    {
      title: "Brand Identity Refresh",
      category: "Graphic Design",
      image: "bg-gradient-to-br from-orange-700 to-orange-900"
    }
  ];

  return (
    <section id="portfolio" className="py-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center px-4 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4 mx-auto">
            <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
            WORK/PORTFOLIO
          </div>
          <h2 className="text-3xl font-bold tracking-tighter mb-4">Our Creative Work</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our portfolio of scroll-stopping content that has helped brands capture attention and drive engagement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item, index) => (
            <div key={index} className="group relative overflow-hidden rounded-lg">
              <div className={`${item.image} w-full h-64 transition-transform duration-500 ease-in-out group-hover:scale-110`} />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-white">
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-sm opacity-80 mb-4">{item.category}</p>
                <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/20">
                  View Solution
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild>
            <Link href="/portfolio">View All Solutions</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}