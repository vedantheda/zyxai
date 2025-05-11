"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Build Your Digital Presence With{" "}
              <span className="text-primary">Nubien</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              We create stunning digital experiences that captivate your audience and grow your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/contact">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/portfolio">View Portfolio</Link>
              </Button>
            </div>
          </div>
          <div className="relative w-full h-[300px] md:h-[500px] flex items-center justify-center">
            <div className="absolute inset-0 w-3/4 h-3/4 bg-primary/20 rounded-lg blur-3xl animate-pulse" />
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 transform rotate-6">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="w-32 h-32 md:w-40 md:h-40 bg-background/80 backdrop-blur-md rounded-lg border border-border flex items-center justify-center p-4 shadow-lg"
                  >
                    <div className="w-full h-full rounded bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 