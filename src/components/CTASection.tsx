"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-20 px-4 md:px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary opacity-90" />
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(to_bottom,transparent,black)]" />
          
          <div className="relative py-16 px-6 sm:px-12 md:py-20 md:px-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-6 text-white max-w-2xl mx-auto">
              Ready to Transform Your Digital Presence?
            </h2>
            <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Let's collaborate to create exceptional digital experiences that drive results and help your business grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                <Link href="/contact">Get in Touch</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                <Link href="/portfolio">Explore Our Work</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 