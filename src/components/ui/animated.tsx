/**
 * Smooth Animations & Transitions
 * Beautiful animations like Linear, Notion, and Framer
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion'
import { cn } from '@/lib/utils'

// Fade in animation
export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className = '',
  ...props 
}: {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
  [key: string]: any
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Slide in from left
export function SlideInLeft({ 
  children, 
  delay = 0,
  className = '',
  ...props 
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  [key: string]: any
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Scale in animation
export function ScaleIn({ 
  children, 
  delay = 0,
  className = '',
  ...props 
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  [key: string]: any
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Stagger children animation
export function StaggerChildren({ 
  children, 
  staggerDelay = 0.1,
  className = '',
  ...props 
}: {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
  [key: string]: any
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

// Animate on scroll
export function AnimateOnScroll({ 
  children, 
  animation = 'fadeIn',
  threshold = 0.1,
  className = '',
  ...props 
}: {
  children: React.ReactNode
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'scaleIn'
  threshold?: number
  className?: string
  [key: string]: any
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  
  const animations = {
    fadeIn: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 }
    },
    slideUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 }
    },
    slideLeft: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 }
    }
  }
  
  const selectedAnimation = animations[animation]
  
  return (
    <motion.div
      ref={ref}
      initial={selectedAnimation.initial}
      animate={isInView ? selectedAnimation.animate : selectedAnimation.initial}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Page transition wrapper
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

// Modal/Dialog animations
export function ModalAnimation({ 
  children, 
  isOpen 
}: { 
  children: React.ReactNode
  isOpen: boolean 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// List item animations
export function ListItemAnimation({ 
  children, 
  index = 0 
}: { 
  children: React.ReactNode
  index?: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ x: 4 }}
      className="transition-colors"
    >
      {children}
    </motion.div>
  )
}

// Button hover animations
export function AnimatedButton({ 
  children, 
  className = '',
  ...props 
}: {
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      className={cn("transition-all", className)}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Card hover animations
export function AnimatedCard({ 
  children, 
  className = '',
  ...props 
}: {
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  return (
    <motion.div
      whileHover={{ 
        y: -4,
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
      }}
      transition={{ duration: 0.2 }}
      className={cn("transition-all", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Loading spinner with animation
export function AnimatedSpinner({ size = 20, className = '' }: { size?: number, className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn("inline-block", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 11-6.219-8.56" />
      </svg>
    </motion.div>
  )
}

// Progress bar animation
export function AnimatedProgress({ 
  value, 
  max = 100, 
  className = '' 
}: { 
  value: number
  max?: number
  className?: string 
}) {
  const percentage = (value / max) * 100
  
  return (
    <div className={cn("w-full bg-muted rounded-full h-2", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-primary h-2 rounded-full"
      />
    </div>
  )
}

// Notification toast animation
export function ToastAnimation({ 
  children, 
  isVisible 
}: { 
  children: React.ReactNode
  isVisible: boolean 
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.5 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
