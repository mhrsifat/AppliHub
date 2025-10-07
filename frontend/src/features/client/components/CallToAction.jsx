// src/features/client/components/CallToAction.jsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function CallToAction() {
  return (
    <section className="py-10 bg-primary text-white">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
        <div className="mb-4 md:mb-0">
          <h3 className="text-xl font-bold">Need help now?</h3>
          <p className="text-sm opacity-90">Fast booking and quick response.</p>
        </div>
        <div>
          <NavLink
            to="/request"
            className="inline-block px-5 py-3 rounded-lg bg-white text-primary font-semibold"
          >
            Request Service
          </NavLink>
        </div>
      </div>
    </section>
  );
}