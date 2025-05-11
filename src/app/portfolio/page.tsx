import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FAQSection } from "@/components/FAQSection";
import { CTASection } from "@/components/CTASection";

export default function PortfolioPage() {
  const portfolioItems = [
    {
      id: 'lemonide-tech',
      title: 'Lemonide Tech',
      year: '2024',
      features: ['AI Integration', 'Responsive Design', 'Custom Layouts', 'Fast Loading'],
      tags: ['E-Commerce', 'Portfolio'],
      images: [
        {
          src: 'https://framerusercontent.com/images/6igmB60fniZZ2g62iKIWQ848llo.jpg',
          alt: 'Ultra Watch'
        },
        {
          src: 'https://framerusercontent.com/images/shPlLwe662SqZNtKzOhZzw5yDGQ.png',
          alt: 'Phone'
        }
      ]
    },
    {
      id: 'viper-studio',
      title: 'Viper Studio',
      year: '2025',
      features: ['Modern Typography', 'User Friendly', 'Flexible CMS', 'SEO Optimized'],
      tags: ['Business', 'Agency'],
      images: [
        {
          src: 'https://framerusercontent.com/images/oITRaXEkBVhukMYINXV2xi05PY.jpg',
          alt: 'Black Cap'
        },
        {
          src: 'https://ext.same-assets.com/209745279/1990824653.png',
          alt: 'Woman'
        }
      ]
    },
    {
      id: 'million-one',
      title: 'Million One',
      year: '2025',
      features: ['Easy Customization', 'Interactive Elements', 'Retina Ready', 'High Performance'],
      tags: ['Portfolio', 'Agency'],
      images: [
        {
          src: 'https://ext.same-assets.com/209745279/1884450559.png',
          alt: 'Car'
        },
        {
          src: 'https://framerusercontent.com/images/mdHohhCEac2dy5qj6Hz8xLx3o.png',
          alt: 'Perfume'
        }
      ]
    }
  ];

  return (
    <main>
      {/* Hero section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="badge mb-6">Browse Our Work</div>
            <h1 className="mb-6">
              <span className="block">Explore Our Most</span>
              <span className="block">Remarkable Projects.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              We craft customized solutions that empower both startups and established brands, driving success and delivering real impact.
            </p>
            <Button asChild size="lg">
              <Link href="/contact">Build Your Product</Link>
            </Button>
          </div>

          {/* Portfolio grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {portfolioItems.map((item) => (
              <Link key={item.id} href={`/portfolio/${item.id}`} className="group">
                <div className="bg-card rounded-xl overflow-hidden border border-border/50 h-full flex flex-col">
                  <div className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs text-muted-foreground">{item.year}</span>
                      <h3 className="text-xl font-bold">{item.title}</h3>
                    </div>

                    <div className="flex flex-col gap-1 mb-4">
                      {item.features.map((feature, index) => (
                        <div key={`${item.id}-feature-${index}`} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M5 10a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z" />
                            </svg>
                          </div>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      {item.tags.map((tag, index) => (
                        <div key={`${item.id}-tag-${index}`} className="px-3 py-1 bg-muted rounded-full text-xs">
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-px mt-auto">
                    <div className="h-40 overflow-hidden">
                      <img
                        src={item.images[0].src}
                        alt={item.images[0].alt}
                        className="w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="h-40 overflow-hidden">
                      <img
                        src={item.images[1].src}
                        alt={item.images[1].alt}
                        className="w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
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
