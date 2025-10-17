// src/features/client/pages/ClientHome.jsx
import React, { Suspense, lazy } from "react";
import Loader from "../../../components/common/Loader";

// Direct imports (critical UI)
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import ServiceHighlights from "../components/ServiceHighlights";
import { createPusherBroadcaster } from "@/features/chat/broadcaster/pusherBroadcaster";
import UserChatWidget from "@/features/chat/components/UserChatWidget";
import useTokenListener from "@/features/chat/useTokenListener";



// Lazy-load non-critical sections
const OurServices = lazy(() => import("../components/OurServices"));
const AboutUs = lazy(() => import("../components/AboutUs"));
const CallToAction = lazy(() => import("../components/CallToAction"));
const Testimonials = lazy(() => import("../components/Testimonials"));
const ProcessSteps = lazy(() => import("../components/ProcessSteps"));
const BlogSection = lazy(() => import("../components/BlogSection"));
const ContactForm = lazy(() => import("../components/ContactForm"));
const Footer = lazy(() => import("../components/Footer"));

const ClientHome = () => {
  const authHeader = useTokenListener();

  const pb = useMemo(() => {
    if (!authHeader) return null;
    return createPusherBroadcaster({
      key: import.meta.env.VITE_PUSHER_KEY,
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
      authHeaders: { Authorization: authHeader },
    });
  }, [authHeader]);
  
  return (
    <>
      {/* Fast-load core */}
      <Navbar />
      <HeroSection />
      <ServiceHighlights />
      <OurServices />
        <AboutUs />
        <CallToAction />
        <Testimonials />
        <ProcessSteps />

      {/* Lazy-load the rest */}
      <Suspense fallback={<Loader size="medium" />}>
        <BlogSection />
        <ContactForm />
        <Footer />
      </Suspense>
      
        <UserChatWidget broadcaster={pb} />
    </>
  );
};

export default ClientHome;
