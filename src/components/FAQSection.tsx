"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function FAQSection() {
  const faqs = [
    {
      question: "What services does Nubien offer?",
      answer: "Nubien offers a comprehensive range of digital services including web design and development, branding, UI/UX design, digital marketing, SEO optimization, and mobile app development."
    },
    {
      question: "How long does a typical web project take?",
      answer: "The timeline for web projects varies depending on complexity and scope. A simple website might take 2-4 weeks, while more complex projects with custom functionality can take 2-3 months or more."
    },
    {
      question: "Do you work with clients internationally?",
      answer: "Yes, we work with clients around the world. Our digital-first approach allows us to collaborate effectively regardless of location, using video calls, project management tools, and regular updates."
    },
    {
      question: "What is your pricing structure?",
      answer: "We offer customized pricing based on project requirements. We can work with fixed-price quotes for well-defined projects or time-and-materials billing for more flexible engagements."
    },
    {
      question: "Do you provide ongoing support after launch?",
      answer: "Yes, we offer various maintenance and support packages to ensure your digital products remain secure, up-to-date, and optimized for performance over time."
    },
    {
      question: "How do you handle revisions during the design process?",
      answer: "Our process includes dedicated revision rounds at key project milestones. We value collaborative feedback and work closely with clients to ensure the final product meets their vision and business goals."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about our services, process, and working relationship.
          </p>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-border">
          {faqs.map((faq, index) => (
            <div key={index} className="py-5">
              <button
                onClick={() => toggleFaq(index)}
                className="flex justify-between items-center w-full text-left"
              >
                <h3 className="text-lg font-semibold">{faq.question}</h3>
                <div className="ml-2 flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-primary" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>
              <div
                className={`mt-2 transition-all duration-300 overflow-hidden ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <Button asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </section>
  );
} 