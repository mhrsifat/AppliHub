// BlogDetailsPage.jsx
import React, { useCallback } from "react";
import { useParams } from "react-router-dom";
import { useBlogDetails } from "../hooks/useClientBlogs";
import BlogVote from "../components/BlogVote";
import BlogComments from "../components/BlogComments";
import { clientBlogService } from "../services/clientBlogService";

export default function BlogDetailsPage() {
  const { slug } = useParams();
  const { blog, loading } = useBlogDetails(slug);

  const refresh = useCallback(() => {
    // simple refresh by refetching the slug; you might dispatch a fetch action instead
    window.location.reload();
  }, []);

  if (loading || !blog) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      {blog.thumbnail && <img src={blog.thumbnail} className="w-full h-72 object-cover rounded mb-4" alt={blog.title} />}
      <h1 className="text-3xl font-bold">{blog.title}</h1>
      <p className="text-sm text-gray-500 mb-4">{blog.category?.name}</p>

      <div className="prose" dangerouslySetInnerHTML={{ __html: blog.content }} />

      <BlogVote blog={blog} onUpdated={refresh} />

      <BlogComments blogId={blog.id} comments={blog.comments || []} refresh={refresh} />
    </div>
  );
}
