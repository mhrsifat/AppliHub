// src/features/client/components/AboutUs.jsx
import React from "react";
import { motion } from "framer-motion";

export default function AboutUs() {
  return (
    <section className="py-16 bg-background text-text">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">Who we are</h2>
            <p className="text-lg mb-4">
              AppliHub is a team of technicians and consultants focused on
              practical, fast and affordable solutions. We combine industry best
              practices with honest customer service.
            </p>
            <ul className="space-y-2">
              <li>• Experienced certified technicians</li>
              <li>• Clear prices and timelines</li>
              <li>• On-site and remote support</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="rounded-xl overflow-hidden shadow-lg bg-surface p-4"
          >
            <img
              src="https://via.placeholder.com/640x420?text=About+Us"
              alt="About us"
              className="w-full h-auto rounded-md"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}