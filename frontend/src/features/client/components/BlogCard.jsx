// BlogCard.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function BlogCard({ blog }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      {blog.thumbnail && <img src={blog.thumbnail} alt={blog.title} className="w-full h-44 object-cover rounded-md mb-3" />}
      <h3 className="text-lg font-semibold mb-1">{blog.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-3">{blog.excerpt}</p>
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs text-gray-500">{blog.category?.name || "Uncategorized"}</span>
        <Link to={`/blogs/${blog.slug}`} className="text-blue-600 text-sm">Read more →</Link>
      </div>
    </div>
  );
}
