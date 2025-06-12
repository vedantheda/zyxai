"use client";

import {
  BarChart,
  Target,
  TrendingUp,
  Search,
  Users,
  Zap
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: <BarChart className="h-10 w-10 text-white" />,
      title: "Performance Analytics",
      description: "Comprehensive data analysis and reporting that tracks every aspect of your marketing campaigns to maximize ROI and drive business growth."
    },
    {
      icon: <Target className="h-10 w-10 text-white" />,
      title: "Targeted Advertising",
      description: "Precision-targeted ad campaigns that reach your ideal customers across multiple platforms with messaging that resonates and converts."
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-white" />,
      title: "Conversion Optimization",
      description: "Data-driven strategies to improve conversion rates at every stage of your marketing funnel, turning more prospects into paying customers."
    },
    {
      icon: <Search className="h-10 w-10 text-white" />,
      title: "Search Marketing",
      description: "Comprehensive SEO and SEM strategies that improve your visibility in search results and drive high-intent traffic to your website."
    },
    {
      icon: <Users className="h-10 w-10 text-white" />,
      title: "Audience Development",
      description: "Strategic audience building and segmentation to create highly targeted marketing campaigns that deliver personalized experiences."
    },
    {
      icon: <Zap className="h-10 w-10 text-white" />,
      title: "Performance Content",
      description: "Scroll-stopping, thumb-pausing content designed specifically to drive measurable actions and deliver tangible business results."
    }
  ];

  return (
    <section id="features" className="py-24 relative">
      {/* Professional designer pattern - subtle grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMTIxMjEiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0zMHY2aDZ2LTZoLTZ6TTYgNHY2aDZ2LTZINnptMCAzMHY2aDZ2LTZINnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center px-4 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
            SERVICES
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-6">Performance Marketing Solutions</h2>
          <p className="text-xl text-muted-foreground">
            We provide data-driven marketing strategies that not only capture attention but drive measurable business results and ROI.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative"
            >
              {/* Card with gradient border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/30 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative flex flex-col h-full p-8 bg-background rounded-2xl border border-border/50 hover:border-transparent transition-all duration-300">
                <div className="p-4 bg-gradient-to-br from-primary to-primary/80 rounded-xl w-fit mb-6 shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
                <div className="mt-auto pt-6">
                  <div className="inline-flex items-center text-primary font-medium">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}