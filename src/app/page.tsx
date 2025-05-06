import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { ServicesSection } from "@/components/ServicesSection";
import { PortfolioSection } from "@/components/PortfolioSection";
import { FAQSection } from "@/components/FAQSection";
import { CTASection } from "@/components/CTASection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <ServicesSection />
      <PortfolioSection />
      <FAQSection />
      <CTASection />
    </main>
  );
}
