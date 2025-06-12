"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem("cookieConsent") === "true";
    if (!hasAccepted) {
      // Show the banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "true");
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookieConsent", "false");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-t border-border/20 shadow-lg"
        >
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">We value your privacy</h3>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={declineCookies}>
                Decline
              </Button>
              <Button 
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                size="sm" 
                onClick={acceptCookies}
              >
                Accept All
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 md:hidden" 
                onClick={declineCookies}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
