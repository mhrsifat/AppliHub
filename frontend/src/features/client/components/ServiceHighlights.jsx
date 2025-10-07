// src/features/client/components/ServiceHighlights.jsx
import React from "react";
import { motion } from "framer-motion";

const features = [
  {
    title: "Expert Technicians",
    desc: "Certified pros to handle any hardware or software issue quickly.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zm0 7l10-5v10l-10 5-10-5V4l10 5z" />
      </svg>
    ),
  },
  {
    title: "Transparent Pricing",
    desc: "No hidden fees — clear quotes before any work begins.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5 3 9 9 13 6-4 9-8 9-13V5l-9-4z" />
      </svg>
    ),
  },
  {
    title: "Fast Turnaround",
    desc: "We prioritize speed without sacrificing quality.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    ),
  },
];

export default function ServiceHighlights() {
  return (
    <section className="py-12 bg-background text-text">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold mb-6">Why choose us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ translateY: -6 }}
              className="p-6 rounded-lg bg-surface shadow-sm"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-md bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted mt-1">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}