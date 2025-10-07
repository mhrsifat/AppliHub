// serviceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import serviceApi from '../services/serviceApi';

export const fetchServices = createAsyncThunk('service/fetchServices', async (params = {}) => {
  return await serviceApi.list(params);
});
export const fetchService = createAsyncThunk('service/fetchService', async (id) => {
  return await serviceApi.show(id);
});
export const createService = createAsyncThunk('service/createService', async (payload) => {
  return await serviceApi.create(payload);
});
export const updateService = createAsyncThunk('service/updateService', async ({ id, payload }) => {
  return await serviceApi.update(id, payload);
});
export const deleteService = createAsyncThunk('service/deleteService', async (id) => {
  return await serviceApi.remove(id);
});
export const importServices = createAsyncThunk('service/import', async (file) => {
  return await serviceApi.import(file);
});
export const exportServices = createAsyncThunk('service/export', async (_, thunkAPI) => {
  const blob = await serviceApi.exportCsv();
  return blob;
});
export const fetchPriceHistory = createAsyncThunk('service/priceHistory', async (id) => {
  return await serviceApi.priceHistory(id);
});

const slice = createSlice({
  name: 'service',
  initialState: {
    list: { data: [], meta: {} },
    item: null,
    priceHistory: [],
    loading: false,
    error: null
  },
  reducers: {
    clearItem(state) {
      state.item = null;
      state.priceHistory = [];
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchServices.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchServices.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload;
      })
      .addCase(fetchServices.rejected, (state, action) => { state.loading = false; state.error = action.error; })
      .addCase(fetchService.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchService.fulfilled, (state, { payload }) => { state.loading = false; state.item = payload; })
      .addCase(fetchService.rejected, (state, action) => { state.loading = false; state.error = action.error; })
      .addCase(createService.pending, state => { state.loading = true; })
      .addCase(createService.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list.data.unshift(payload);
      })
      .addCase(createService.rejected, (state, action) => { state.loading = false; state.error = action.error; })
      .addCase(updateService.pending, state => { state.loading = true; })
      .addCase(updateService.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list.data = state.list.data.map(d => d.id === payload.id ? payload : d);
        if (state.item?.id === payload.id) state.item = payload;
      })
      .addCase(updateService.rejected, (state, action) => { state.loading = false; state.error = action.error; })
      .addCase(deleteService.fulfilled, (state, { meta }) => {
        const id = meta.arg;
        state.list.data = state.list.data.filter(d => d.id !== id);
        if (state.item?.id === id) state.item = null;
      })
      .addCase(fetchPriceHistory.fulfilled, (state, { payload }) => {
        state.priceHistory = payload;
      });
  }
});

export const { clearItem } = slice.actions;
export default slice.reducer;
