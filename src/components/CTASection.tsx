"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-28 px-4 md:px-6 relative noise-bg">
      {/* Designer-quality background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>

        {/* Static decorative elements instead of random particles */}
        <div className="absolute top-1/5 left-1/5 w-2 h-2 rounded-full bg-primary/20"></div>
        <div className="absolute top-2/5 right-1/5 w-3 h-3 rounded-full bg-primary/20"></div>
        <div className="absolute bottom-1/5 left-2/5 w-2 h-2 rounded-full bg-primary/20"></div>
        <div className="absolute top-3/5 right-2/5 w-4 h-4 rounded-full bg-primary/20"></div>
        <div className="absolute bottom-2/5 left-3/5 w-3 h-3 rounded-full bg-primary/20"></div>
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl">
          {/* Advanced gradient background with texture */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-primary/70" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2Nmg2di02aC02em0wLTMwdjZoNnYtNmgtNnpNNiA0djZoNnYtNkg2em0wIDMwdjZoNnYtNkg2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />

          {/* Designer-quality decorative elements */}
          <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-br from-white/10 to-transparent rounded-bl-[10rem] backdrop-blur-sm"></div>
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-white/10 to-transparent rounded-tr-[10rem] backdrop-blur-sm"></div>

          {/* Decorative lines */}
          <div className="absolute top-10 left-10 w-20 h-1 bg-white/20 rounded-full"></div>
          <div className="absolute top-14 left-10 w-10 h-1 bg-white/20 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-20 h-1 bg-white/20 rounded-full"></div>
          <div className="absolute bottom-14 right-10 w-10 h-1 bg-white/20 rounded-full"></div>

          {/* Content with parallax effect */}
          <div className="relative py-20 px-8 sm:px-16 md:py-24 md:px-24 parallax">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium mb-6 glass-effect parallax-layer">
                  <span className="w-2 h-2 rounded-full bg-white mr-2"></span>
                  <span className="relative">
                    CONTACT PAGE
                    <span className="absolute -bottom-0.5 left-0 w-full h-px bg-white/40"></span>
                  </span>
                </div>

                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8 text-white parallax-layer">
                  Ready to <span className="relative inline-block px-2">
                    <span className="relative z-10">Drive Measurable</span>
                    <span className="absolute inset-0 bg-white/10 rounded-lg -rotate-1 transform"></span>
                  </span> Results?
                </h2>

                <p className="text-lg md:text-xl mb-10 text-white/90 parallax-layer-back">
                  Let's create scroll-stopping, thumb-pausing, logic-defying performance marketing campaigns that capture attention in the first 0.5 seconds and deliver real ROI for your business.
                </p>

                <div className="flex flex-col sm:flex-row gap-5 justify-center parallax-layer">
                  <Button size="lg" className="designer-button rounded-xl px-8 py-6" asChild>
                    <Link href="/contact">
                      <span className="flex items-center">
                        Plug into Notch
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 rounded-xl px-8 py-6 backdrop-blur-sm" asChild>
                    <Link href="/portfolio">Show me proof</Link>
                  </Button>
                </div>

                {/* Designer touch - decorative dots */}
                <div className="flex gap-2 mt-12">
                  <div className="w-2 h-2 rounded-full bg-white/30"></div>
                  <div className="w-2 h-2 rounded-full bg-white/60"></div>
                  <div className="w-2 h-2 rounded-full bg-white/30"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}