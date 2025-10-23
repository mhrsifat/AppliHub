import React from "react";
import { lazy } from "react";

const Navbar = lazy(() => import("@/features/client/components/Navbar"));
const Footer = lazy(() => import("@/features/client/components/Footer"));

export default function About() {
  // demo (ডেমো) data for a local service provider (সার্ভিস প্রদানকারী)
  const provider = {
    id: 1,
    name: "GhorDekho Home Services",
    tagline: "Reliable home repairs & cleaning — fast and fair",
    description:
      "GhorDekho offers plumbing, electrical, AC maintenance, and deep cleaning for Dhaka homes. Skilled technicians, transparent pricing and same-day support.",
    address: "House 21, Road 7, Gulshan, Dhaka",
    phone: "+8801711-123456",
    email: "hello@ghordekho.example",
    hours: {
      mon_fri: "9:00 AM — 8:00 PM",
      sat: "10:00 AM — 6:00 PM",
      sun: "Closed",
    },
    services: [
      { id: "s1", title: "Plumbing — পলাকার কাজ", price: 450, short: "Fix leaks, replace taps" },
      { id: "s2", title: "Electrical — বৈদ্যুতিক কাজ", price: 600, short: "Wiring, socket, switch" },
      { id: "s3", title: "AC Maintenance — এসি সার্ভিস", price: 1200, short: "Gas refill, cleaning" },
      { id: "s4", title: "Deep Cleaning — ডিপ ক্লিনিং", price: 2500, short: "Full-house deep clean" },
    ],
    testimonials: [
      { id: 1, name: "Rina K.", text: "Fast, professional and affordable. Highly recommend!" },
      { id: 2, name: "Arif H.", text: "Technician arrived on time and solved the issue the same day." },
    ],
    gallery: [
      "/images/ghordekho/1.jpg",
      "/images/ghordekho/2.jpg",
      "/images/ghordekho/3.jpg",
      "/images/ghordekho/4.jpg",
    ],
  };

  return (
    <>
      <Navbar />
      <main className="p-6 max-w-5xl mx-auto">
        {/* Hero / হিরো */}
        <header className="bg-white rounded shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{provider.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{provider.tagline}</p>
              <p className="mt-4 text-gray-700">{provider.description}</p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-1 bg-gray-100 rounded">Address: {provider.address}</span>
                <span className="px-3 py-1 bg-gray-100 rounded">Phone: {provider.phone}</span>
                <span className="px-3 py-1 bg-gray-100 rounded">Email: {provider.email}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded shadow-sm w-full md:w-72">
              <div className="text-sm text-gray-500">Opening Hours</div>
              <div className="mt-2 text-sm">
                <div>Mon–Fri: {provider.hours.mon_fri}</div>
                <div>Sat: {provider.hours.sat}</div>
                <div>Sun: {provider.hours.sun}</div>
              </div>

              <a
                href={`tel:${provider.phone.replace(/\s+/g, "")}`}
                className="mt-4 inline-block w-full text-center px-3 py-2 bg-blue-600 text-white rounded"
              >
                Call Now
              </a>
            </div>
          </div>
        </header>

        {/* Services */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Our Services (সার্ভিস সমূহ)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {provider.services.map((s) => (
              <div key={s.id} className="bg-white p-4 rounded shadow-sm flex flex-col">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{s.title}</div>
                    <div className="text-sm text-gray-500">{s.short}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">From</div>
                    <div className="font-semibold">{s.price.toFixed(2)} BDT</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <a
                    href={`mailto:${provider.email}?subject=Service%20Inquiry%20-%20${encodeURIComponent(s.title)}`}
                    className="px-3 py-2 border rounded text-sm"
                  >
                    Email
                  </a>
                  <a
                    href={`tel:${provider.phone.replace(/\s+/g, "")}`}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
                  >
                    Book Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery (গ্যালারি) */}
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Gallery (গ্যালারি)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {provider.gallery.map((src, idx) => (
              <div key={idx} className="bg-gray-100 rounded overflow-hidden h-28">
                <img
                  src={src}
                  alt={`${provider.name} photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // placeholder fallback—keep JS inline
                    e.currentTarget.src = "/images/placeholder-1.png";
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials (প্রশংসাপত্র) */}
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Testimonials (প্রশংসাপত্র)</h3>
          <div className="space-y-3">
            {provider.testimonials.map((t) => (
              <blockquote key={t.id} className="bg-white p-4 rounded shadow-sm">
                <p className="text-gray-700">“{t.text}”</p>
                <footer className="mt-2 text-sm text-gray-500">— {t.name}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* Quick contact / CTA */}
        <section className="mb-10">
          <div className="bg-gradient-to-r from-white to-gray-50 p-6 rounded shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h4 className="font-semibold">Need help right away?</h4>
              <p className="text-sm text-gray-600">Call or email and we'll dispatch a technician.</p>
            </div>
            <div className="flex gap-3">
              <a
                href={`tel:${provider.phone.replace(/\s+/g, "")}`}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Call {provider.phone}
              </a>
              <a
                href={`mailto:${provider.email}`}
                className="px-4 py-2 border rounded"
              >
                Send Email
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}