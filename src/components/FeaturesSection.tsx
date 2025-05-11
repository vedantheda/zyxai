"use client";

import { 
  Brush, 
  Code2, 
  LineChart, 
  Smartphone, 
  Globe, 
  Search
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: <Brush className="h-10 w-10 text-primary" />,
      title: "Creative Design",
      description: "Stunning visuals that capture your brand's essence and engage your audience effectively."
    },
    {
      icon: <Code2 className="h-10 w-10 text-primary" />,
      title: "Web Development",
      description: "Custom websites built with the latest technologies for optimal performance and user experience."
    },
    {
      icon: <LineChart className="h-10 w-10 text-primary" />,
      title: "Digital Marketing",
      description: "Strategic campaigns that increase your visibility and drive meaningful conversions."
    },
    {
      icon: <Smartphone className="h-10 w-10 text-primary" />,
      title: "Mobile Apps",
      description: "Intuitive and responsive mobile applications that extend your reach to all devices."
    },
    {
      icon: <Globe className="h-10 w-10 text-primary" />,
      title: "Digital Strategy",
      description: "Comprehensive planning that aligns your digital presence with your business goals."
    },
    {
      icon: <Search className="h-10 w-10 text-primary" />,
      title: "SEO Optimization",
      description: "Data-driven optimization to improve your search rankings and drive organic traffic."
    }
  ];

  return (
    <section id="features" className="py-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter mb-4">Our Services</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We offer comprehensive digital solutions to help your business thrive in the online world.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col p-6 bg-background rounded-lg border border-border hover:border-primary/50 hover:shadow-lg transition-all group"
            >
              <div className="p-3 bg-muted rounded-lg w-fit mb-4 group-hover:bg-primary/10 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 