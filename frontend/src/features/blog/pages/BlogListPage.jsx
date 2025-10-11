// BlogListPage.jsx
import React, { useState } from "react";
import useBlogs from "../hooks/useBlogs";
import BlogTable from "../components/BlogTable";
import BlogForm from "../components/BlogForm";
import { useDispatch } from "react-redux";
import { createBlog, updateBlog } from "../slices/blogSlice";

export default function BlogListPage() {
  const { list, loading, categories, tags, onDelete } = useBlogs();
  const [selected, setSelected] = useState(null);
  const dispatch = useDispatch();

  const handleSave = (form) => {
    if (form.id) dispatch(updateBlog({ id: form.id, payload: form }));
    else dispatch(createBlog(form));
    setSelected(null);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Blogs</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <BlogForm initial={selected || {}} onSave={handleSave} />
        </div>

        <div>
          <BlogTable blogs={list} loading={loading} onEdit={setSelected} onDelete={onDelete} onPreview={(b) => window.open(`/blogs/${b.slug}`, "_blank")} />
        </div>
      </div>
    </div>
  );
}
