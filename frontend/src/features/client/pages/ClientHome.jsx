// src/features/client/pages/ClientHome.jsx
import React, { Suspense, lazy } from 'react';
import Loader from '../../../components/common/Loader';

// Lazy-load components
const Navbar = lazy(() => import('../components/Navbar'));
const HeroSection = lazy(() => import('../components/HeroSection'));
const ServiceHighlights = lazy(() => import('../components/ServiceHighlights'));
const OurServices = lazy(() => import('../components/OurServices'));
const AboutUs = lazy(() => import('../components/AboutUs'));
const CallToAction = lazy(() => import('../components/CallToAction'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const ProcessSteps = lazy(() => import('../components/ProcessSteps'));
const BlogSection = lazy(() => import('../components/BlogSection'));
const ContactForm = lazy(() => import('../components/ContactForm'));

const ClientHome = () => {
  return (
    <Suspense fallback={<Loader />}>
      {/* Navigation Bar */}
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Service Highlights */}
      <ServiceHighlights />

      {/* Our Services */}
      <OurServices />

      {/* About Us / Who We Are */}
      <AboutUs />

      {/* Call to Action */}
      <CallToAction />

      {/* Testimonials */}
      <Testimonials />

      {/* Process / How We Work */}
      <ProcessSteps /> 

      {/* Blog Section */}
      <BlogSection /> 

      {/* Contact Form */}
      <ContactForm /> 

    </Suspense>
  );
};

export default ClientHome;