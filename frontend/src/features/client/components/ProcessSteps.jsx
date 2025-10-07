// src/features/client/components/ProcessSteps.jsx
import React from "react";

const steps = [
  { title: "Request", desc: "Tell us what you need" },
  { title: "Diagnose", desc: "We inspect and quote" },
  { title: "Repair", desc: "We fix it fast" },
  { title: "Deliver", desc: "Return and follow-up" },
];

export default function ProcessSteps() {
  return (
    <section className="py-12 bg-background text-text">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold mb-6">Our Process</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="p-6 bg-surface rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold mb-4">
                {i + 1}
              </div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm mt-2 text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}