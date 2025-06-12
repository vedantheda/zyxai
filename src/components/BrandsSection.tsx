"use client";

export function BrandsSection() {
  // Sample brand logos - replace with actual client logos
  const brands = [
    {
      name: "Brand 1",
      logo: "https://ext.same-assets.com/3700402891/3061093526.svg" // Replace with actual logo URLs
    },
    {
      name: "Brand 2",
      logo: "https://ext.same-assets.com/3700402891/2751859665.svg"
    },
    {
      name: "Brand 3",
      logo: "https://ext.same-assets.com/3700402891/2959825768.svg"
    },
    {
      name: "Brand 4",
      logo: "https://ext.same-assets.com/3700402891/3061093526.svg"
    },
    {
      name: "Brand 5",
      logo: "https://ext.same-assets.com/3700402891/2751859665.svg"
    },
    {
      name: "Brand 6",
      logo: "https://ext.same-assets.com/3700402891/2959825768.svg"
    }
  ];

  return (
    <section className="py-16 bg-muted/10">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center px-4 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4 mx-auto">
            <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
            BRANDS WE HAVE WORKED WITH
          </div>
          <h2 className="text-3xl font-bold tracking-tighter mb-4">Trusted by Leading Brands</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We've helped these brands create scroll-stopping performance marketing campaigns that drive measurable business results and ROI.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {brands.map((brand, index) => (
            <div
              key={index}
              className="w-full h-20 flex items-center justify-center grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-h-12 max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
