import React, { Suspense, lazy } from 'react';
import Loader from '../../../components/common/Loader';

// Direct imports (critical UI)
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ServiceHighlights from '../components/ServiceHighlights';

// Lazy-load only non-critical sections
const OurServices = lazy(() => import('../components/OurServices'));
const AboutUs = lazy(() => import('../components/AboutUs'));
const CallToAction = lazy(() => import('../components/CallToAction'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const ProcessSteps = lazy(() => import('../components/ProcessSteps'));
const BlogSection = lazy(() => import('../components/BlogSection'));
const ContactForm = lazy(() => import('../components/ContactForm'));
const Footer = lazy(() => import('../components/Footer'));

const ClientHome = () => {
  return (
    <>
      {/* Fast-load core */}
      <Navbar />
      <HeroSection />
      <ServiceHighlights />

      {/* Lazy-load the rest */}
      <Suspense fallback={<Loader size="medium" />}>
        <OurServices />
        <AboutUs />
        <CallToAction />
        <Testimonials />
        <ProcessSteps />
        <BlogSection />
        <ContactForm />
        <Footer />
      </Suspense>
    </>
  );
};

export default ClientHome;