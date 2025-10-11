// src/routes/ClientRoutes.jsx
import React, { lazy, Suspense } from "react";
import Loader from "../components/common/Loader";

const ClientHome = lazy(() => import("../features/client/pages/ClientHome"));
const BlogListPage = lazy(() => import("../features/client/pages/BlogListPage"));
const BlogDetailsPage = lazy(() => import("../features/client/pages/BlogDetailsPage"));

const ClientRoutes = [
  {
    path: "/",
    element: (
        <ClientHome />
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
];

export default ClientRoutes;
