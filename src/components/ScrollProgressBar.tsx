"use client";

import { useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show the progress bar after scrolling down a bit
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80 z-[60] origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
