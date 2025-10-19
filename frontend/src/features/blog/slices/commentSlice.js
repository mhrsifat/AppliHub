// filepath: src/features/blog/slices/commentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import blogService from '../services/blogService';

// fetch comments for a blog (optional; backend may return comments with blog)
export const fetchComments = createAsyncThunk('comments/fetchComments', async (blogId) => {
  const res = await blogService.getComments(blogId);
  return { blogId, payload: res.data || res };
});

export const postComment = createAsyncThunk('comments/postComment', async ({ blogId, body }) => {
  const res = await blogService.postComment(blogId, body);
  return { blogId, comment: res.data || res };
});

const initialState = {
  commentsByPost: {}, // { [blogId]: [comments] }
  status: 'idle',
};

const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    addCommentLocal(state, action) {
      const { blogId, comment } = action.payload;
      state.commentsByPost[blogId] = state.commentsByPost[blogId] || [];
      state.commentsByPost[blogId].push(comment);
    },
    addReplyLocal(state, action) {
      const { blogId, parentId, reply } = action.payload;
      const list = state.commentsByPost[blogId] || [];
      const parent = list.find((c) => c.id === parentId);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(reply);
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchComments.fulfilled, (s, a) => {
        s.commentsByPost[a.payload.blogId] = a.payload.payload.data ? a.payload.payload.data : a.payload.payload;
      })
      .addCase(postComment.fulfilled, (s, a) => {
        s.commentsByPost[a.payload.blogId] = s.commentsByPost[a.payload.blogId] || [];
        s.commentsByPost[a.payload.blogId].push(a.payload.comment);
      });
  },
});

export const { addCommentLocal, addReplyLocal } = commentSlice.actions;
export default commentSlice.reducer;
