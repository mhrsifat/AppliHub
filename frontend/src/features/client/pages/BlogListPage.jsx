// BlogListPage.jsx
import React from "react";
import { useClientBlogs } from "../hooks/useClientBlogs";
import BlogCard from "../components/BlogCard";

export default function BlogListPage() {
  const { list, loading } = useClientBlogs();

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map((b) => <BlogCard key={b.id} blog={b} />)}
    </div>
  );
}
