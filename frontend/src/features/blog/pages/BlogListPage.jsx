// filepath: src/features/blog/pages/BlogListPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts } from '../slices/blogSlice';
import { Link } from 'react-router-dom';

export default function BlogListPage() {
  const dispatch = useDispatch();
  const posts = useSelector((s) => s.blog.posts || []);
  const status = useSelector((s) => s.blog.status);

  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Blog</h1>
      {status === 'loading' && <div>Loading...</div>}
      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="p-4 bg-white rounded shadow-sm">
            <Link to={`/blog/${post.slug ?? post.id}`} className="text-lg font-semibold text-blue-600">
              {post.title}
            </Link>
            <p className="mt-2 text-gray-600">{post.excerpt}</p>
            <div className="mt-2 text-sm text-gray-500">
              {post.category?.name || 'Uncategorized'} · {post.tags?.map(t => t.name).join(', ')} · {post.views ?? 0} views
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
