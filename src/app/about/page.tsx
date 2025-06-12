import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FAQSection } from "@/components/FAQSection";
import { CTASection } from "@/components/CTASection";

export default function AboutPage() {
  const teamCircles = Array.from({ length: 9 }).map((_, i) => `team-circle-${i + 1}`);

  return (
    <main>
      {/* Hero Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="badge mb-6">Explore Our Journey</div>
            <h1 className="mb-6">
              <span className="block">Pioneering Performance Marketing</span>
              <span className="block text-gradient">with Notch!</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Notch is your trusted partner for performance marketing solutions. We specialize in creating scroll-stopping content that drives measurable results.
            </p>
            <Button asChild size="lg">
              <Link href="#about">Learn About Notch</Link>
            </Button>
          </div>
        </div>

        <div className="absolute inset-0 z-0 opacity-20">
          <img
            src="https://ext.same-assets.com/3700402891/395515836.jpeg"
            alt="Woman Using Laptop"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-background/80" />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2">
              <div className="mb-6">
                <div className="badge mb-4">About Notch</div>
                <img
                  src="https://ext.same-assets.com/3700402891/3061093526.svg"
                  alt="Icon"
                  className="w-10 h-10"
                />
              </div>
              <h2 className="mb-6">
                <span className="block">Transforming Marketing</span>
                <span className="block">With Performance-Driven Content</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Notch is a leading performance marketing agency built for brands, marketers, and businesses seeking better engagement, conversion, and ROI from their digital marketing efforts.
              </p>
            </div>

            <div className="w-full md:w-1/2 space-y-8">
              <div className="rounded-lg bg-card border border-border/50 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src="https://ext.same-assets.com/3700402891/3829437231.svg"
                    alt="Icon"
                    className="w-10 h-10"
                  />
                  <div>
                    <h3 className="text-xl font-bold mb-1">Create</h3>
                    <h4 className="text-lg font-medium mb-3">Built for Modern Digital Marketers</h4>
                    <p className="text-muted-foreground text-sm">
                      Whether you're managing a brand, e-commerce store, or specialized business, Notch provides marketing solutions that speak the language of modern consumers. Our strategies are purpose-built to help you capture attention and drive conversions.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <div className="px-3 py-1 bg-muted rounded-full text-xs">Content Creation</div>
                      <div className="px-3 py-1 bg-muted rounded-full text-xs">Performance-Driven</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-card border border-border/50 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src="https://ext.same-assets.com/3700402891/3010029770.svg"
                    alt="Icon"
                    className="w-10 h-10"
                  />
                  <div>
                    <h3 className="text-xl font-bold mb-1">Measure</h3>
                    <h4 className="text-lg font-medium mb-3">Designed for Marketing Performance</h4>
                    <p className="text-muted-foreground text-sm">
                      Notch is crafted with analytics, optimization, and results at its core. Our marketing solutions are designed to track performance while providing seamless experiences for brands and their customers alike.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <div className="px-3 py-1 bg-muted rounded-full text-xs">Data-Driven</div>
                      <div className="px-3 py-1 bg-muted rounded-full text-xs">ROI Focused</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-muted/20 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <img
                src="https://ext.same-assets.com/3700402891/3112532987.jpeg"
                alt="Team Working"
                className="rounded-lg shadow-xl w-full"
              />
            </div>

            <div className="w-full md:w-1/2 order-1 md:order-2">
              <div className="badge mb-4">Scale</div>
              <img
                src="https://ext.same-assets.com/3700402891/2751859665.svg"
                alt="Icon"
                className="w-10 h-10 mb-4"
              />
              <h2 className="mb-6">Scales With Your Marketing Needs</h2>
              <p className="text-muted-foreground mb-8">
                From startups to enterprise brands, Notch solutions are flexible and scalable. As your marketing needs grow, our strategies adapt—so your campaigns evolve with your business goals.
              </p>
              <Button asChild>
                <Link href="/contact">Get Started Today</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2">
              <div className="mb-6">
                <div className="badge mb-4">Notch Solutions</div>
                <img
                  src="https://ext.same-assets.com/3700402891/2959825768.svg"
                  alt="Icon"
                  className="w-10 h-10"
                />
              </div>
              <h2 className="mb-6">
                <span className="block">Elevate Your Brand with</span>
                <span className="block">Performance Marketing!</span>
              </h2>

              <div className="space-y-6">
                <div className="bg-card border border-border/50 rounded-lg p-6">
                  <h4 className="text-xl font-bold mb-2">Scroll-Stopping Content</h4>
                  <p className="text-muted-foreground">
                    We combine creative expertise and data-driven insights to build attention-grabbing content that helps brands stand out in crowded feeds.
                  </p>
                </div>

                <div className="bg-card border border-border/50 rounded-lg p-6">
                  <h4 className="text-xl font-bold mb-2">Improving Marketing ROI</h4>
                  <p className="text-muted-foreground">
                    Our expertise in performance marketing and analytics ensures your campaigns can provide optimal engagement while improving conversion efficiency.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Button asChild>
                  <Link href="/contact">Get a Free Consultation</Link>
                </Button>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex justify-center">
              <div className="bg-card border border-border/50 rounded-lg p-8 w-full max-w-md">
                <span className="block text-sm text-muted-foreground mb-2">Trusted by</span>
                <span className="block text-2xl font-bold mb-8">500+ Global Brands</span>

                <div className="grid grid-cols-3 gap-4">
                  {teamCircles.map((id) => (
                    <div
                      key={id}
                      className="aspect-square rounded-full bg-muted/50"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection />
    </main>
  );
}
