// filepath: src/features/blog/slices/blogSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';
import blogService from '../services/blogService';

// Async thunks (thunk = অ্যাসিঙ্ক একশন)
export const fetchPosts = createAsyncThunk('blog/fetchPosts', async (params = {}) => {
  const res = await blogService.getPosts(params);
  return res.data || res;
});

export const fetchPost = createAsyncThunk('blog/fetchPost', async (slug) => {
  const res = await blogService.getPost(slug);
  return res.data || res;
});

export const createPost = createAsyncThunk('blog/createPost', async (payload) => {
  const res = await blogService.createPost(payload);
  return res.data || res;
});

export const updatePost = createAsyncThunk('blog/updatePost', async ({ id, payload }) => {
  const res = await blogService.updatePost(id, payload);
  return res.data || res;
});

export const votePost = createAsyncThunk('blog/votePost', async ({ id, vote }) => {
  const res = await blogService.votePost(id, vote);
  return res.data || res;
});

const initialState = {
  posts: [],
  current: null,
  categories: [],
  tags: [],
  status: 'idle',
  error: null,
};

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    addCategory(state, action) {
      state.categories.push(action.payload);
    },
    addTag(state, action) {
      state.tags.push(action.payload);
    },
    // local optimistic update for votes
    upvoteLocal(state, action) {
      const id = action.payload;
      const p = state.posts.find((x) => x.id === id);
      if (p) p.upvotes = (p.upvotes || 0) + 1;
      if (state.current && state.current.id === id) state.current.upvotes = (state.current.upvotes || 0) + 1;
    },
    downvoteLocal(state, action) {
      const id = action.payload;
      const p = state.posts.find((x) => x.id === id);
      if (p) p.downvotes = (p.downvotes || 0) + 1;
      if (state.current && state.current.id === id) state.current.downvotes = (state.current.downvotes || 0) + 1;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchPosts.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchPosts.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.posts = a.payload.data ? a.payload.data : a.payload;
      })
      .addCase(fetchPosts.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message; })

      .addCase(fetchPost.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchPost.fulfilled, (s, a) => { s.status = 'succeeded'; s.current = a.payload; })
      .addCase(fetchPost.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message; })

      .addCase(createPost.fulfilled, (s, a) => {
        // backend returns created resource
        s.posts.unshift(a.payload);
      })

      .addCase(updatePost.fulfilled, (s, a) => {
        const idx = s.posts.findIndex((p) => p.id === a.payload.id);
        if (idx > -1) s.posts[idx] = a.payload;
        if (s.current && s.current.id === a.payload.id) s.current = a.payload;
      })

      .addCase(votePost.fulfilled, (s, a) => {
        // payload expected: { upvotes, downvotes } and backend does not always return full post
        if (s.current) {
          s.current.upvotes = a.payload.upvotes ?? s.current.upvotes;
          s.current.downvotes = a.payload.downvotes ?? s.current.downvotes;
        }
      });
  },
});

export const { addCategory, addTag, upvoteLocal, downvoteLocal } = blogSlice.actions;
export default blogSlice.reducer;
