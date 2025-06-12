"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/CTASection";
import { useParams } from "next/navigation";
import { getItemById, getRelatedItems, categories } from "../categories";
import { Video, ArrowLeft, Share2, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function PortfolioItemPage() {
  const params = useParams();
  const itemId = params.id as string;
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Get the portfolio item
  const item = getItemById(itemId);
  
  // Get related items
  const relatedItems = getRelatedItems(itemId);
  
  // If item not found, show error
  if (!item) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Project Not Found</h1>
        <p className="mb-8">The project you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/portfolio">Back to Portfolio</Link>
        </Button>
      </div>
    );
  }
  
  // Get category name
  const category = categories.find(c => c.id === item.category);

  return (
    <main>
      {/* Hero Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8">
            <Link href="/portfolio" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portfolio
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left column - Media */}
            <div>
              {/* Main image or video */}
              <div className="rounded-xl overflow-hidden border border-border/50 mb-6 aspect-video relative">
                {item.videoUrl && isPlaying ? (
                  <iframe
                    src={item.videoUrl}
                    className="w-full h-full absolute inset-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="relative w-full h-full">
                    <img 
                      src={item.images[0].src} 
                      alt={item.images[0].alt}
                      className="w-full h-full object-cover"
                    />
                    {item.videoUrl && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                        onClick={() => setIsPlaying(true)}
                      >
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                          <Video className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Thumbnail gallery */}
              <div className="grid grid-cols-2 gap-4">
                {item.images.map((image, index) => (
                  <div key={index} className="rounded-lg overflow-hidden border border-border/50 aspect-video">
                    <img 
                      src={image.src} 
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right column - Content */}
            <div>
              <div className="badge mb-4">{category?.name || 'Project'}</div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{item.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">Client: {item.client}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {item.tags.map((tag, index) => (
                  <div key={index} className="badge">{tag}</div>
                ))}
              </div>
              
              <div className="space-y-6 mb-8">
                <div>
                  <h2 className="text-xl font-bold mb-2">Overview</h2>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                
                <div>
                  <h2 className="text-xl font-bold mb-2">The Challenge</h2>
                  <p className="text-muted-foreground">{item.challenge}</p>
                </div>
                
                <div>
                  <h2 className="text-xl font-bold mb-2">Our Solution</h2>
                  <p className="text-muted-foreground">{item.solution}</p>
                </div>
                
                <div>
                  <h2 className="text-xl font-bold mb-2">Results</h2>
                  <ul className="space-y-2">
                    {item.results.map((result, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-muted-foreground">{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Live Project
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Related Projects Section */}
      {relatedItems.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl font-bold mb-8">Related Projects</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedItems.map(relatedItem => (
                <Link key={relatedItem.id} href={`/portfolio/${relatedItem.id}`} className="group">
                  <div className="bg-card rounded-xl overflow-hidden border border-border/50 h-full flex flex-col">
                    <div className="p-4">
                      <h3 className="font-bold mb-1">{relatedItem.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">Client: {relatedItem.client}</p>
                      <div className="badge">{categories.find(c => c.id === relatedItem.category)?.name || 'Project'}</div>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={relatedItem.images[0].src} 
                          alt={relatedItem.images[0].alt}
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
      )}
      
      {/* CTA Section */}
      <CTASection />
    </main>
  );
}
