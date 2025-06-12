import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FAQSection } from "@/components/FAQSection";
import { CTASection } from "@/components/CTASection";

export default function ContactPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="badge mb-6">Get In Touch</div>
            <h1 className="mb-6">
              <span className="block">Ready to Plug Into</span>
              <span className="block text-gradient">Performance Marketing?</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Let's discuss how Notch can help your brand create scroll-stopping content that drives measurable results.<br />
              Fill out the form below and we'll get back to you within 24 hours.
            </p>
            <Button asChild size="lg">
              <a href="#contact-form">Contact Us Now</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-12 md:py-16 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="bg-card border border-border/50 rounded-xl p-8 md:p-12 max-w-4xl mx-auto">
            <form className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first-name" className="block text-sm font-medium mb-2">
                    First name*
                  </label>
                  <Input
                    id="first-name"
                    placeholder="Jane"
                    className="bg-muted/50"
                    required
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label htmlFor="last-name" className="block text-sm font-medium mb-2">
                    Last Name*
                  </label>
                  <Input
                    id="last-name"
                    placeholder="Smith"
                    className="bg-muted/50"
                    required
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  How can we reach you?*
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@framer.com"
                  className="bg-muted/50"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium mb-2">
                    Where Are you from?*
                  </label>
                  <div className="relative">
                    <select
                      id="country"
                      className="w-full h-10 px-3 py-2 bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                      required
                      suppressHydrationWarning
                      defaultValue=""
                    >
                      <option value="" disabled>Select your country...</option>
                      <option value="us">United States</option>
                      <option value="uk">United Kingdom</option>
                      <option value="ca">Canada</option>
                      <option value="au">Australia</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="service-type" className="block text-sm font-medium mb-2">
                    What service are you interested in?*
                  </label>
                  <div className="relative">
                    <select
                      id="service-type"
                      className="w-full h-10 px-3 py-2 bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                      required
                      suppressHydrationWarning
                      defaultValue=""
                    >
                      <option value="" disabled>Select a service</option>
                      <option value="social">Social Media Marketing</option>
                      <option value="content">Content Creation</option>
                      <option value="performance">Performance Marketing</option>
                      <option value="strategy">Marketing Strategy</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message*
                </label>
                <Textarea
                  id="message"
                  placeholder="Type your message..."
                  className="bg-muted/50 min-h-[120px]"
                  required
                  suppressHydrationWarning
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Send Your Message
              </Button>
            </form>
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
