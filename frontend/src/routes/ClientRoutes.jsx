// src/routes/ClientRoutes.jsx
import React, { lazy, Suspense } from "react";
import Loader from "../components/common/Loader";

const ClientHome = lazy(() => import("../features/client/pages/ClientHome"));
const RequestService = lazy(() => import("../features/client/pages/RequestService"));
const BlogListPage = lazy(() => import("../features/client/pages/BlogListPage"));
const BlogDetailsPage = lazy(() => import("../features/client/pages/BlogDetailsPage"));
const TrackOrder = lazy(() => import("../features/client/pages/TrackOrder"));
const About = lazy(() => import("../features/client/pages/About"));
const NotFound = lazy(() => import("../features/client/pages/NotFound"));

const ClientRoutes = [
  {
    path: "/",
    element: (
        <ClientHome />
    ),
  },
  {
    path: "/request-service",
    element: (
        <RequestService />
    ),
  },
  
  {
    path: "/track",
    element: (
        <TrackOrder />
    ),
  },
  {
    path: "/blogs",
    element: (
      <Suspense fallback={<Loader size="medium" />}>
        <BlogListPage />
      </Suspense>
    ),
  },
  {
    path: "/blog/:slug",
    element: (
      <Suspense fallback={<Loader size="medium" />}>
        <BlogDetailsPage />
      </Suspense>
    ),
  },
  {
    path: "/about",
    element: (
      <Suspense fallback={<Loader size="medium" />}>
        <About />
      </Suspense>
    ),
  },
  {
    path: "/not-found",
    element: (
      <Suspense fallback={<Loader size="medium" />}>
        <NotFound />
      </Suspense>
    ),
  },
];

export default ClientRoutes;
