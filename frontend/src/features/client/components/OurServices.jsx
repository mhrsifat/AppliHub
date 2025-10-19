// src/features/client/components/OurServices.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { WrenchScrewdriverIcon, ComputerDesktopIcon, ShieldCheckIcon, WifiIcon } from '@heroicons/react/24/outline';


const services = [
  {
    slug: "repair",
    icon: "wrench-screwdriver",
    title: "Repair",
    desc: "Hardware repair for phones, laptops and tablets.",
  },
  {
    slug: "installation",
    icon: "computer-desktop",
    title: "Installation",
    desc: "On-site and remote installation services.",
  },
  {
    slug: "maintenance",
    icon: "shield-check",
    title: "Maintenance",
    desc: "Regular checkups to keep devices healthy.",
  },
  {
    slug: "network",
    icon: "wifi",
    title: "Networking",
    desc: "Setup, optimization and troubleshooting.",
  },
];

export default function OurServices() {
  return (
    <section className="py-12 bg-background text-text">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold mb-6">Our Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => (
            <motion.div
              key={s.slug}
              whileHover={{ scale: 1.02 }}
              className="p-5 rounded-lg bg-surface shadow-sm flex flex-col"
            >
              <div className="flex-1">
                <div className="mb-4 text-primary">
                  {s.icon === "wrench-screwdriver" && <WrenchScrewdriverIcon className="h-8 w-8" />}
                  {s.icon === "computer-desktop" && <ComputerDesktopIcon className="h-8 w-8" />}
                  {s.icon === "shield-check" && <ShieldCheckIcon className="h-8 w-8" />}
                  {s.icon === "wifi" && <WifiIcon className="h-8 w-8" />}
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted">{s.desc}</p>
              </div>
              <div className="mt-4">
                <NavLink
                  to={`/services/${s.slug}`}
                  className="inline-block text-sm font-medium"
                >
                  Learn more →
                </NavLink>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}