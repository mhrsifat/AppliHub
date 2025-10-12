// src/features/client/components/BlogSection.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClientBlogs } from "../slices/clientBlogSlice";
import { NavLink } from "react-router-dom";

export default function BlogSection() {
  const dispatch = useDispatch();
  const {
    list: posts = [],
    loading,
    error,
  } = useSelector((state) => state.clientBlog);

  useEffect(() => {
    dispatch(fetchClientBlogs());
  }, [dispatch]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (posts.length === 0) {
    return <div>No blog posts available.</div>;
  }

  return (
    <section className="py-12 bg-background text-text">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold mb-6">From our blog</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((p) => (
            <article
              key={p.slug}
              className="bg-surface rounded-lg overflow-hidden shadow-sm"
            >
              <img
                src={p.thumbnail || "https://picsum.photos/400/240?random=1"}
                alt={p.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-muted mb-3">{p.excerpt}</p>
                <NavLink to={`/blog/${p.slug}`} className="text-sm font-medium">
                  Read more →
                </NavLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
