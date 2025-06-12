"use client";

import { motion } from "framer-motion";
import { User, Calendar, BarChart3, Shield } from "lucide-react";

export function HeroCard() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full max-w-4xl mx-auto bg-black/60 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
    >
      {/* Top Stats Row */}
      <div className="grid grid-cols-3 gap-4 p-6 border-b border-white/10">
        <div className="flex flex-col">
          <span className="text-white/60 text-sm mb-1">Campaigns</span>
          <span className="text-white text-3xl font-bold">2,845</span>
        </div>
        <div className="flex flex-col">
          <span className="text-white/60 text-sm mb-1">Conversions</span>
          <span className="text-white text-3xl font-bold">186</span>
        </div>
        <div className="flex flex-col">
          <span className="text-white/60 text-sm mb-1">ROAS</span>
          <span className="text-white text-3xl font-bold">3.4x</span>
        </div>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-2 gap-4 p-6">
        {/* Card 1 */}
        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="ml-3 text-white font-medium">Audience Targeting</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="ml-3 text-white font-medium">Campaigns</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="ml-3 text-white font-medium">Analytics</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="ml-3 text-white font-medium">Performance</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full" style={{ width: '90%' }}></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
