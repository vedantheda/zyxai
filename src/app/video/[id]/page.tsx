"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/CTASection";
import { useParams } from "next/navigation";
import { Play, Share2, Download, Info } from "lucide-react";
import { useState } from "react";

export default function VideoPage() {
  const params = useParams();
  const videoId = params.id as string;
  const [isPlaying, setIsPlaying] = useState(false);

  // Sample video data - in a real app, this would come from an API or database
  const videoDatabase = {
    "lifestyle-brand-campaign": {
      title: "Lifestyle Brand Campaign",
      client: "Urban Outfitters",
      description: "A series of scroll-stopping video content for a major lifestyle brand's summer campaign that increased engagement by 45% across social platforms.",
      thumbnail: "https://images.unsplash.com/photo-1492288991661-058aa541ff43?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      stats: {
        views: "1.2M",
        engagement: "45%",
        conversions: "12%"
      },
      tags: ["Lifestyle", "Social Media", "Brand Campaign"]
    },
    "tech-startup-launch": {
      title: "Tech Startup Launch",
      client: "Quantum AI",
      description: "Launch campaign for an innovative tech startup that helped them achieve 300% of their crowdfunding goal through compelling video storytelling.",
      thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      stats: {
        views: "850K",
        engagement: "38%",
        conversions: "15%"
      },
      tags: ["Technology", "Startup", "Launch Campaign"]
    },
    "food-beverage-series": {
      title: "Food & Beverage Series",
      client: "Artisan Eats",
      description: "A mouth-watering content series for a premium food brand that showcased their products in a way that literally made viewers stop scrolling.",
      thumbnail: "https://images.unsplash.com/photo-1495195134817-aeb325a55b65?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      stats: {
        views: "2.3M",
        engagement: "52%",
        conversions: "18%"
      },
      tags: ["Food & Beverage", "Product Showcase", "Social Media"]
    }
  };

  // Default video data if ID doesn't match
  const defaultVideo = {
    title: "Creative Content",
    client: "Notch Client",
    description: "Scroll-stopping creative content that captures attention in the first 0.5 seconds and delivers real results.",
    thumbnail: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    stats: {
      views: "1M+",
      engagement: "40%+",
      conversions: "10%+"
    },
    tags: ["Creative Content", "Video Production", "Brand Campaign"]
  };

  // Get video data based on ID or use default
  const video = videoDatabase[videoId as keyof typeof videoDatabase] || defaultVideo;

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  return (
    <main>
      {/* Video Hero Section */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            {/* Video Player */}
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 border border-border/50 shadow-xl">
              {isPlaying ? (
                <iframe
                  src={video.videoUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${video.thumbnail})` }}
                >
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <button
                      onClick={handlePlayClick}
                      className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center transition-transform hover:scale-110"
                    >
                      <Play className="h-10 w-10 text-white" fill="white" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{video.title}</h1>
                <p className="text-lg text-muted-foreground mb-4">Client: {video.client}</p>
                <p className="text-lg mb-6">{video.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {video.tags.map((tag, index) => (
                    <span key={index} className="badge">{tag}</span>
                  ))}
                </div>
                
                <div className="flex gap-4 mb-8">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download Brief
                  </Button>
                  <Button className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Case Study
                  </Button>
                </div>
              </div>
              
              <div className="w-full md:w-64 bg-card rounded-xl p-6 border border-border/50 h-fit">
                <h3 className="text-lg font-bold mb-4">Performance</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Views</p>
                    <p className="text-2xl font-bold">{video.stats.views}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Engagement Rate</p>
                    <p className="text-2xl font-bold">{video.stats.engagement}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">{video.stats.conversions}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Videos Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-2xl font-bold mb-8">More Videos Like This</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(videoDatabase)
              .filter(([id]) => id !== videoId)
              .slice(0, 3)
              .map(([id, videoData]) => (
                <Link key={id} href={`/video/${id}`} className="group">
                  <div className="bg-card rounded-xl overflow-hidden border border-border/50 h-full">
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={videoData.thumbnail} 
                        alt={videoData.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                          <Play className="h-6 w-6 text-white" fill="white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold mb-1">{videoData.title}</h3>
                      <p className="text-sm text-muted-foreground">{videoData.client}</p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />
    </main>
  );
}
