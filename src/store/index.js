import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import usageReducer from './slices/usageSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    usage: usageReducer,
  },
});