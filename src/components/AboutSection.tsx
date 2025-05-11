"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative h-[400px] rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 p-6">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="w-full aspect-square bg-background rounded-lg shadow-lg flex items-center justify-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter mb-2">
                About Nubien Creative Agency
              </h2>
              <div className="w-20 h-1 bg-primary rounded mb-6" />
            </div>
            <p className="text-muted-foreground">
              Nubien is a digital creative agency focused on delivering exceptional
              web experiences for businesses of all sizes.
            </p>
            <p className="text-muted-foreground">
              We combine expertise in design, development, and marketing to create
              holistic digital solutions that help our clients stand out in today's
              competitive landscape.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
              <div>
                <h3 className="font-bold mb-2">Our Mission</h3>
                <p className="text-sm text-muted-foreground">
                  To empower brands through innovative digital solutions.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Our Vision</h3>
                <p className="text-sm text-muted-foreground">
                  To be the most trusted creative partner for ambitious brands.
                </p>
              </div>
            </div>
            <Button asChild className="w-fit mt-4">
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
} 