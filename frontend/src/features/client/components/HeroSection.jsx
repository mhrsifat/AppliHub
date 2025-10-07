// src/features/client/components/HeroSection.jsx
import React from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="min-h-[60vh] flex items-center bg-background text-text">
      <div className="container mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              We build apps that people actually use
            </h1>
            <p className="text-lg max-w-xl">
              Fast, reliable service for device repair, installation and
              maintenance. We focus on delivering practical solutions with clear
              pricing and honest timelines.
            </p>

            <div className="flex items-center space-x-4">
              <NavLink
                to="/request"
                className="inline-block px-6 py-3 rounded-lg bg-primary text-white font-medium shadow-md transition-transform hover:scale-[1.02]"
              >
                Request Service
              </NavLink>
              <NavLink
                to="/services"
                className="inline-block px-4 py-3 rounded-lg border border-current text-text"
              >
                Our Services
              </NavLink>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="w-full rounded-xl overflow-hidden shadow-lg bg-surface p-6">
              <img
                src="https://via.placeholder.com/720x420?text=Service+Preview"
                alt="Service preview"
                className="w-full h-auto rounded-md"
              />
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">100+</div>
                  <div className="text-sm">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">95%</div>
                  <div className="text-sm">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm">Support</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}