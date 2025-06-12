"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AboutSection() {
  return (
    <section id="about" className="py-28 relative">
      {/* Professional designer pattern - subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background"></div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            {/* Decorative elements */}
            <div className="absolute -top-10 -left-10 w-40 h-40 border-t-2 border-l-2 border-primary/20 rounded-tl-3xl"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 border-b-2 border-r-2 border-primary/20 rounded-br-3xl"></div>

            {/* Main image area with 3D effect */}
            <div className="relative mx-auto max-w-md">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl transform rotate-3"></div>
              <div className="relative bg-background rounded-2xl shadow-xl overflow-hidden border border-border/50 transform -rotate-3 transition-transform hover:rotate-0 duration-500">
                <div className="p-1 bg-gradient-to-r from-primary/20 to-primary/5">
                  <div className="bg-background p-6 rounded-xl">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Feature blocks with professional styling */}
                      <div className="bg-muted/50 p-5 rounded-xl border border-border/50">
                        <div className="w-10 h-10 rounded-full bg-primary/20 mb-3 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-medium mb-1">HIPAA Compliant</h4>
                        <p className="text-xs text-muted-foreground">Secure patient data management</p>
                      </div>
                      <div className="bg-muted/50 p-5 rounded-xl border border-border/50">
                        <div className="w-10 h-10 rounded-full bg-primary/20 mb-3 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-medium mb-1">Cloud-Based</h4>
                        <p className="text-xs text-muted-foreground">Access from anywhere, anytime</p>
                      </div>
                      <div className="bg-muted/50 p-5 rounded-xl border border-border/50">
                        <div className="w-10 h-10 rounded-full bg-primary/20 mb-3 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-medium mb-1">Fast Integration</h4>
                        <p className="text-xs text-muted-foreground">Quick setup with existing systems</p>
                      </div>
                      <div className="bg-muted/50 p-5 rounded-xl border border-border/50">
                        <div className="w-10 h-10 rounded-full bg-primary/20 mb-3 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-medium mb-1">Analytics</h4>
                        <p className="text-xs text-muted-foreground">Powerful insights and reporting</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div>
              <div className="inline-flex items-center justify-center px-4 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
                <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
                WHAT MAKES NOTCH, NOTCH!!
              </div>
              <h2 className="text-4xl font-bold tracking-tight mb-4 leading-tight">
                About Notch Performance Marketing
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full mb-6" />
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed">
              At Notch, we create scroll-stopping, thumb-pausing, logic-defying performance marketing campaigns that capture attention in the first 0.5 seconds and drive measurable business results.
              Our team combines data-driven strategy with creative execution to deliver marketing that makes your audience stop, engage, and convert.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We're not just another marketing agency - we're your performance marketing plug for campaigns that stand out and deliver ROI.
              Our results speak for themselves, and our clients keep coming back for more of that "Why didn't we think of that?" magic.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-2">
              <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Our Mission</h3>
                <p className="text-muted-foreground">
                  To create performance marketing campaigns that stop the scroll, capture attention, and deliver measurable ROI for brands that want to grow in a competitive digital landscape.
                </p>
              </div>
              <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Our Vision</h3>
                <p className="text-muted-foreground">
                  To be the go-to performance marketing partner for brands seeking campaigns that drive growth, exceed ROI targets, and make clients say "Why didn't we think of that?"
                </p>
              </div>
            </div>

            <Button asChild className="w-fit mt-4 rounded-xl px-8 py-6 shadow-lg">
              <Link href="/about">
                <span className="flex items-center">
                  Learn More About Us
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}