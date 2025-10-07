// src/routes/ClientRoutes.jsx
import React, { lazy, Suspense } from "react";
import Loader from "../components/common/Loader";

const ClientHome = lazy(() => import("../features/client/pages/ClientHome"));

const ClientRoutes = [
  {
    path: "/",
    element: (
      <Suspense fallback={<Loader size="medium" />}>
        <ClientHome />
      </Suspense>
    ),
  },
  {
    path: "/client/profile",
    element: (
      <Suspense fallback={<Loader size="medium" />}>
        <ClientHome />
      </Suspense>
    ),
  },
];

export default ClientRoutes;
