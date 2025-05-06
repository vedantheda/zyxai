"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Droplets } from "lucide-react";

export function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/#faq" },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="hero-glow" />

      {/* Header */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/80 backdrop-blur-md shadow-md" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto py-4 px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full bg-gradient-ocean flex items-center justify-center overflow-hidden group">
              <Droplets className="h-5 w-5 text-white animate-wave" />
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ripple"></div>
            </div>
            <span className="text-xl font-bold">Nubien</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-foreground/80 hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex">
            <Button asChild>
              <Link href="/contact">Get In Touch</Link>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-background/95 backdrop-blur-lg">
              <nav className="flex flex-col gap-4 mt-8">
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-foreground/80 hover:text-primary transition-colors text-lg py-2"
                  >
                    {item.label}
                  </Link>
                ))}
                <Button asChild className="mt-4">
                  <Link href="/contact">Get In Touch</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="pt-20">{children}</main>

      {/* Footer */}
      <footer className="bg-background border-t border-border/20">
        <div className="container mx-auto py-12 px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="relative w-8 h-8 rounded-full bg-gradient-ocean flex items-center justify-center overflow-hidden">
                  <Droplets className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Nubien</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Made remotely with ❤ and passion<br />
                - Westhill Studio.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4">Template Pages</h4>
              <ul className="space-y-2">
                {menuItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-foreground/80 hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4">Social</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://x.com/MandroDesign"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    Twitter (X)
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    Youtube
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.framer.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    Framer
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4">Subscribe Form</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter Your Email..."
                  className="flex-1 px-3 py-2 rounded-md bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  suppressHydrationWarning
                />
                <Button>Subscribe Us</Button>
              </div>
            </div>
          </div>

          <div className="border-t border-border/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Mandro Design
            </p>
            <div className="flex gap-4">
              <Link
                href="/terms-conditions"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/privacy-policy"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
