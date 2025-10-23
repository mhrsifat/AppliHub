import React from "react";
import { lazy } from "react";

const Navbar = lazy(() => import("@/features/client/components/Navbar"));
const Footer = lazy(() => import("@/features/client/components/Footer"));

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-lg text-gray-700 mb-6">Page not found (পেজ পাওয়া যায়নি)</p>

          <div className="space-x-3">
            <a
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Go to Home
            </a>
            <a
              href="/contact"
              className="px-4 py-2 border rounded"
            >
              Contact Support (যোগাযোগ)
            </a>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            If you reached here from an internal link, consider checking the router (রাউটার) configuration.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}