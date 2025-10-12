// src/features/blog/Routes.jsx
import React, { lazy } from "react";
import { Route } from "react-router-dom";

// Lazy load admin pages for performance
const BlogListPage = lazy(() => import("./pages/BlogListPage"));
const BlogFormPage = lazy(() => import("./pages/BlogFormPage")); // used for create & edit
const BlogPreviewPage = lazy(() => import("./pages/BlogPreviewPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const TagPage = lazy(() => import("./pages/TagPage"));
const CommentsPage = lazy(() => import("./pages/CommentsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ToolsPage = lazy(() => import("./pages/ToolsPage"));

const BlogRoutes = (
  <>
    {/* Admin Blog Dashboard / List */}
    <Route path="blogs" element={<BlogListPage />} />
    {/* Create new blog */}
    <Route path="blogs/create" element={<BlogFormPage />} />
    {/* Edit existing blog */}
    <Route path="blogs/:id/edit" element={<BlogFormPage />} />
    {/* Preview blog (admin preview) */}
    <Route path="blogs/:id/preview" element={<BlogPreviewPage />} />

    {/* Category & Tag management */}
    <Route path="blogs/categories" element={<CategoryPage />} />
    <Route path="blogs/tags" element={<TagPage />} />

    {/* Comments moderation */}
    <Route path="blogs/comments" element={<CommentsPage />} />

    {/* Optional admin utilities */}
    <Route path="blogs/settings" element={<SettingsPage />} />
    <Route path="blogs/tools" element={<ToolsPage />} />
  </>
);

export default BlogRoutes;
