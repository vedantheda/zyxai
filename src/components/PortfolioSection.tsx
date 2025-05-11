"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PortfolioSection() {
  const portfolioItems = [
    {
      title: "Modern E-commerce",
      category: "Web Development",
      image: "bg-gradient-to-br from-purple-500 to-blue-600"
    },
    {
      title: "Corporate Rebrand",
      category: "Brand Identity",
      image: "bg-gradient-to-br from-green-500 to-teal-600"
    },
    {
      title: "Mobile App Design",
      category: "UI/UX Design",
      image: "bg-gradient-to-br from-red-500 to-orange-600"
    },
    {
      title: "Marketing Platform",
      category: "Web Development",
      image: "bg-gradient-to-br from-blue-500 to-cyan-600"
    },
    {
      title: "Portfolio Website",
      category: "Web Design",
      image: "bg-gradient-to-br from-amber-500 to-yellow-600"
    },
    {
      title: "Brand Guidelines",
      category: "Branding",
      image: "bg-gradient-to-br from-pink-500 to-rose-600"
    }
  ];

  return (
    <section id="portfolio" className="py-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter mb-4">Our Portfolio</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our recent projects and see how we've helped businesses transform their digital presence.
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
                  View Project
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild>
            <Link href="/portfolio">View All Projects</Link>
          </Button>
        </div>
      </div>
    </section>
  );
} 