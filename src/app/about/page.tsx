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
              <span className="block">Pioneering AI Innovation</span>
              <span className="block">with Revolution!</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Reboot is your trusted agency for creative strategy. We specialize in cutting-edge digital business solutions.
            </p>
            <Button asChild size="lg">
              <Link href="#about">View About Reboot</Link>
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
                <div className="badge mb-4">About Nubien</div>
                <img
                  src="https://ext.same-assets.com/3700402891/3061093526.svg"
                  alt="Icon"
                  className="w-10 h-10"
                />
              </div>
              <h2 className="mb-6">
                <span className="block">Shaping Tomorrow</span>
                <span className="block">With Bold Ideas</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Nubien is a next-gen AI agency template built for bold visionaries, researchers, and builders shaping the future of intelligence.
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
                    <h3 className="text-xl font-bold mb-1">Innovate</h3>
                    <h4 className="text-lg font-medium mb-3">Built for Cutting-Edge AI Teams</h4>
                    <p className="text-muted-foreground text-sm">
                      Whether you're developing LLMs, intelligent tools, or autonomous agents, Nubien gives you a launch-ready site that speaks the language of innovation. The layout is purpose-built to help you showcase your services, and vision clearly.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <div className="px-3 py-1 bg-muted rounded-full text-xs">AI Agency</div>
                      <div className="px-3 py-1 bg-muted rounded-full text-xs">Future Ready</div>
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
                    <h3 className="text-xl font-bold mb-1">Trust</h3>
                    <h4 className="text-lg font-medium mb-3">Designed to Build Instant Trust</h4>
                    <p className="text-muted-foreground text-sm">
                      Nubien is crafted with clean typography, smooth transitions, and modern layouts that convey credibility at first glance. Perfect for agencies and startups needing to look established and reliable from day one.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <div className="px-3 py-1 bg-muted rounded-full text-xs">Trust By Design</div>
                      <div className="px-3 py-1 bg-muted rounded-full text-xs">Modern UX</div>
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
              <h2 className="mb-6">Scales With Your Vision</h2>
              <p className="text-muted-foreground mb-8">
                From product launches to team showcases and case studies, Nubien is flexible and scalable. As your agency grows, the template adapts—so your site evolves without needing a redesign.
              </p>
              <Button asChild>
                <Link href="/contact">Book an Appointment</Link>
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
                <div className="badge mb-4">About Nubien</div>
                <img
                  src="https://ext.same-assets.com/3700402891/2959825768.svg"
                  alt="Icon"
                  className="w-10 h-10"
                />
              </div>
              <h2 className="mb-6">
                <span className="block">Elevate Brands with</span>
                <span className="block">Innovation Tech!</span>
              </h2>

              <div className="space-y-6">
                <div className="bg-card border border-border/50 rounded-lg p-6">
                  <h4 className="text-xl font-bold mb-2">Smart Digital Solutions</h4>
                  <p className="text-muted-foreground">
                    We combine technology and creativity to build future-ready solutions that help businesses thrive in a competitive landscape.
                  </p>
                </div>

                <div className="bg-card border border-border/50 rounded-lg p-6">
                  <h4 className="text-xl font-bold mb-2">Elevating Brands with Strategy</h4>
                  <p className="text-muted-foreground">
                    Our expertise in branding, marketing, and design ensures your business stands out, leaving a lasting impact on your audience.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Button asChild>
                  <Link href="/contact">Book an Appointment</Link>
                </Button>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex justify-center">
              <div className="bg-card border border-border/50 rounded-lg p-8 w-full max-w-md">
                <span className="block text-sm text-muted-foreground mb-2">Trusted by</span>
                <span className="block text-2xl font-bold mb-8">900+ People Rated</span>

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
