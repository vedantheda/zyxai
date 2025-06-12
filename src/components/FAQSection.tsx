"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function FAQSection() {
  const faqs = [
    {
      question: "What performance marketing services does Notch offer?",
      answer: "Notch offers a comprehensive suite of performance marketing services including paid search (PPC), paid social, programmatic advertising, conversion rate optimization, analytics and attribution, email marketing, and performance content creation. We specialize in campaigns that capture attention in the first 0.5 seconds and drive measurable results."
    },
    {
      question: "How do you measure campaign performance?",
      answer: "We establish clear KPIs aligned with your business objectives at the beginning of each campaign. We track performance using advanced analytics tools and provide transparent reporting on metrics like ROAS, CPA, conversion rates, and revenue attribution. Our data-driven approach ensures we can continuously optimize for better results."
    },
    {
      question: "What platforms and channels do you work with?",
      answer: "We work across all major digital marketing platforms including Google Ads, Meta (Facebook/Instagram), TikTok, LinkedIn, Twitter, Amazon, and programmatic networks. We recommend the optimal channel mix based on your target audience, objectives, and budget."
    },
    {
      question: "What is your pricing structure?",
      answer: "We offer flexible pricing models including percentage of ad spend, fixed retainers, and performance-based arrangements. Our pricing is transparent and tailored to your business size, campaign complexity, and growth objectives. We'll provide detailed options during our initial consultation."
    },
    {
      question: "How quickly can we expect to see results?",
      answer: "While some improvements can be seen within the first few weeks, meaningful performance marketing results typically develop over 2-3 months as we gather data, test different approaches, and optimize campaigns. We provide regular updates and transparent reporting throughout the process."
    },
    {
      question: "Do you work with businesses of all sizes?",
      answer: "Yes, we work with businesses from startups to enterprise-level companies. We tailor our approach based on your business size, industry, objectives, and budget. Our strategies scale effectively whether you're investing $5,000 or $500,000 per month in your marketing campaigns."
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
          <div className="inline-flex items-center justify-center px-4 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4 mx-auto">
            <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
            FAQ
          </div>
          <h2 className="text-3xl font-bold tracking-tighter mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about our performance marketing services, process, and how we can help your brand drive measurable results.
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