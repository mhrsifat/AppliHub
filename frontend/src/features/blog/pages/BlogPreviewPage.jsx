// src/features/blog/pages/BlogPreviewPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { blogService } from "../services/blogService";

export default function BlogPreviewPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [blog, setBlog] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("Missing blog id");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await blogService.get(id); // blogService.get accepts id or slug
        // If API returns { data: ... } shape, adjust:
        const payload = res.data?.data ?? res.data ?? res;
        setBlog(payload);
      } catch (err) {
        setError(err?.message || "Failed to load blog");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6">Loading preview…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!blog) return <div className="p-6">No blog found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-2">{blog.title}</h1>
      <p className="text-sm text-gray-500 mb-4">{blog.category?.name}</p>

      {blog.thumbnail && (
        <img src={blog.thumbnail} alt={blog.title} className="w-full h-64 object-cover rounded mb-4" />
      )}

      <div className="prose" dangerouslySetInnerHTML={{ __html: blog.content }} />

      <div className="mt-6 text-sm text-gray-500">
        <div>Views: {blog.views ?? blog.views_count ?? 0}</div>
        <div>Upvotes: {blog.upvotes ?? 0} · Downvotes: {blog.downvotes ?? 0}</div>
      </div>
    </div>
  );
}
