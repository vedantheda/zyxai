"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Preloader() {
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Modern loading animation with phases
  useEffect(() => {
    // Phase 0: Initial animation (500ms)
    // Phase 1: Transition animation (500ms)
    // Phase 2: Logo formation (500ms)
    // Phase 3: Complete and exit (300ms)

    const timer1 = setTimeout(() => setPhase(1), 500);
    const timer2 = setTimeout(() => setPhase(2), 1000);
    const timer3 = setTimeout(() => setPhase(3), 1500);
    const timer4 = setTimeout(() => setLoading(false), 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  // DNA helix animation
  useEffect(() => {
    if (!canvasRef.current || phase > 1) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: {x: number, y: number, size: number, color: string, vx: number, vy: number}[] = [];
    const particleCount = 100;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;

    // Create DNA helix particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 10;
      const x = centerX + Math.cos(angle) * radius * Math.sin(angle * 0.2);
      const y = centerY + (i / particleCount) * canvas.height * 0.8 - canvas.height * 0.4;
      const size = Math.random() * 2 + 1;

      // Alternate colors for DNA strands
      const color = i % 2 === 0 ?
        `rgba(198, 38, 38, ${Math.random() * 0.5 + 0.5})` :
        `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.2})`;

      particles.push({
        x, y, size, color,
        vx: 0,
        vy: 0
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Phase 0: DNA helix animation
      if (phase === 0) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const angle = (i / particleCount) * Math.PI * 10 + Date.now() * 0.001;
          p.x = centerX + Math.cos(angle) * radius * Math.sin(angle * 0.2);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();

          // Connect particles to form DNA strands
          if (i > 0 && i % 2 === 0) {
            ctx.beginPath();
            ctx.moveTo(particles[i-2].x, particles[i-2].y);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = 'rgba(198, 38, 38, 0.2)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      // Phase 1: Particle explosion
      else if (phase === 1) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Add explosion velocity if not already set
          if (p.vx === 0) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
          }

          p.x += p.vx;
          p.y += p.vy;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [phase]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
        >
          {/* Simplified loading animation for better performance */}
          {phase < 2 && (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Logo Formation (Phase 2) */}
          {phase >= 2 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="relative z-10"
            >
              <div className="flex items-center">
                <div className="relative w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center overflow-hidden shadow-lg">
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </motion.svg>
                  <div className="absolute inset-0 bg-primary/20 rounded-xl"></div>
                </div>
                <div className="ml-4">
                  <motion.h1
                    className="text-3xl font-bold"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    Notch
                  </motion.h1>
                  <motion.p
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    Performance Marketing
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Removed circuit board pattern */}

          {/* Pulsing glow effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
