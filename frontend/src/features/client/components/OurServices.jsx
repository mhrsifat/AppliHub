// src/features/client/components/OurServices.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const services = [
  {
    slug: "repair",
    title: "Repair",
    desc: "Hardware repair for phones, laptops and tablets.",
  },
  {
    slug: "installation",
    title: "Installation",
    desc: "On-site and remote installation services.",
  },
  {
    slug: "maintenance",
    title: "Maintenance",
    desc: "Regular checkups to keep devices healthy.",
  },
  {
    slug: "network",
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