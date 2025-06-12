"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroCard } from "@/components/HeroCard";

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden noise-bg">
      {/* Designer-quality background elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-40 h-40 border-8 border-primary rounded-full"></div>
        <div className="absolute top-40 left-1/3 w-20 h-80 border-8 border-primary"></div>
        <div className="absolute bottom-20 right-1/4 w-60 h-60 border-8 border-primary rounded-full"></div>
        <div className="absolute top-60 right-1/3 w-80 h-20 border-8 border-primary"></div>
      </div>

      {/* Static decorative elements instead of random particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-primary/10"></div>
        <div className="absolute top-1/3 right-1/4 w-4 h-4 rounded-full bg-primary/10"></div>
        <div className="absolute bottom-1/4 left-1/3 w-5 h-5 rounded-full bg-primary/10"></div>
        <div className="absolute top-2/3 right-1/3 w-6 h-6 rounded-full bg-primary/10"></div>
        <div className="absolute bottom-1/3 left-2/3 w-4 h-4 rounded-full bg-primary/10"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-6 parallax">
            <div className="inline-flex items-center px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-primary text-sm font-medium mb-2 glass-effect backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
              Performance Marketing Agency
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight parallax-layer">
              Your Audience Has 0.5 Seconds to Care.{" "}
              <span className="relative inline-block">
                <span className="text-gradient">We Make Sure They Do.</span>
                <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/30 rounded-full"></span>
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-md parallax-layer-back">
              Notch is your performance marketing plug for scroll-stopping, thumb-pausing, logic-defying content that drives measurable results. Smart strategy, sharper targeting, and the occasional "Why didn't we think of that?"
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 parallax-layer">
              <Button size="lg" className="designer-button px-8 py-6" asChild>
                <Link href="/portfolio" className="flex items-center gap-2">
                  <span>Show me proof</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl border-2 border-primary/20 hover:border-primary/50 backdrop-blur-sm px-8 py-6" asChild>
                <Link href="/contact">Plug into Notch</Link>
              </Button>
            </div>
          </div>
          <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center parallax">
            <div className="absolute inset-0 w-3/4 h-3/4 bg-primary/10 rounded-[40px] blur-3xl parallax-layer-deep" />

            {/* Modern dashboard card using our new HeroCard component */}
            <div className="relative z-10 w-full h-full flex items-center justify-center perspective-1000 parallax-layer">
              <div className="relative w-full max-w-lg transform rotate-6 shadow-2xl overflow-hidden morph-shadow">
                <HeroCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}