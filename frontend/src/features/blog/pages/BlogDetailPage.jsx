// filepath: src/features/blog/pages/BlogDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPost, votePost, upvoteLocal, downvoteLocal } from '../slices/blogSlice';
import { postComment, addCommentLocal } from '../slices/commentSlice';
import { useParams } from 'react-router-dom';
import blogService from '../services/blogService';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const current = useSelector((s) => s.blog.current);
  const comments = useSelector((s) => s.comments.commentsByPost?.[current?.id] || []);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (slug) dispatch(fetchPost(slug));
  }, [dispatch, slug]);

  const handleVote = async (voteType) => {
    // optimistic UI
    if (voteType === 'up') dispatch(upvoteLocal(current.id));
    else dispatch(downvoteLocal(current.id));

    try {
      await dispatch(votePost({ id: current.id, vote: voteType })).unwrap();
    } catch (e) {
      // revert not implemented - keep simple
      console.error('vote failed', e);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    // optimistic local add with temp id
    const temp = { id: Date.now(), user_name: 'You', comment_text: commentText, replies: [] };
    dispatch(addCommentLocal({ blogId: current.id, comment: temp }));
    setCommentText('');
    try {
      await dispatch(postComment({ blogId: current.id, body: { blog_id: current.id, comment_text: commentText } })).unwrap();
    } catch (e) {
      console.error('comment post failed', e);
    }
  };

  if (!current) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">{current.title}</h1>
      <div className="text-sm text-gray-500">{current.category?.name}</div>
      <div className="mt-4 prose" dangerouslySetInnerHTML={{ __html: current.content }} />
      <div className="mt-4 space-x-2">
        <button onClick={() => handleVote('up')} className="px-3 py-1 bg-green-600 text-white rounded">Upvote ({current.upvotes ?? 0})</button>
        <button onClick={() => handleVote('down')} className="px-3 py-1 bg-red-600 text-white rounded">Downvote ({current.downvotes ?? 0})</button>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Comments</h2>
        <ul className="mt-4 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="p-3 border rounded">
              <div className="text-sm font-medium">{c.user_name || 'Anonymous'}</div>
              <div className="mt-1">{c.comment_text}</div>
              {c.replies?.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {c.replies.map((r) => (
                    <li key={r.id} className="pl-3 border-l">{r.comment_text}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmitComment} className="mt-4">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full border rounded p-2"
            rows={4}
            placeholder="Write your comment..."
          />
          <button type="submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
        </form>
      </section>
    </div>
  );
}
