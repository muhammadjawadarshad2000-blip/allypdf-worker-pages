import { createSlice } from '@reduxjs/toolkit';

const getTodayDateString = () => new Date().toDateString();

const ACTION_KEYS = [
  'merge',
  'split',
  'delete',
  'extract',
  'rearrange',
  'protect',
  'unlock',
  'pdfToPng',
  'pngToPdf',
  'pdfToJpg',
  'JPGToPdf',
  'compressImage',
  'editPdf',
  'rotatePdf',
  'imageToPdf',
  'imageToJPG',
  'imageToPng',
  'imageToWebp',
  'cropPdf',
  'cropImage',
  'extractText',
  'extractImages',
  'htmlToImage',
  'htmlToPdf',
  'resizeImage',
  'rotateImage',
  'compressPdf',
  'watermarkPdf',
  'pageNumbers',
  'flattenPdf',
  'signPdf',
  'repairPdf',
  'pdfToPdfa',
];

// Build a zeroed usage object
const buildZeroUsage = () =>
  ACTION_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

// Build limits for non-authenticated users (default 10 per action)
const buildNonAuthLimits = () =>
  ACTION_KEYS.reduce((acc, key) => {
    acc[key] = 10;
    return acc;
  }, {});

const getInitialState = () => {
  const savedUsage = localStorage.getItem('pdf_usage_data');
  
  if (savedUsage) {
    try {
      const parsed = JSON.parse(savedUsage);
      const today = getTodayDateString();

      if (parsed.lastUsedDate === today) {
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse local usage data", e);
    }
  }

  // Default fallback
  return {
    dailyUsage: buildZeroUsage(),
    lastUsedDate: getTodayDateString(),
    limits: {
      nonAuthenticated: buildNonAuthLimits(),
    },
  };
};

const usageSlice = createSlice({
  name: 'usage',
  initialState: getInitialState(),
  reducers: {
    incrementUsage: (state, action) => {
      const key = action.payload;
      const today = getTodayDateString();

      // Reset counters if it's a new day
      if (state.lastUsedDate !== today) {
        // Zero out all known keys instead of hardcoding
        Object.keys(state.dailyUsage).forEach((k) => {
          state.dailyUsage[k] = 0;
        });
        state.lastUsedDate = today;
      }

      // Ensure key exists to avoid NaN when incrementing
      if (state.dailyUsage[key] === undefined) {
        state.dailyUsage[key] = 0;
      }

      state.dailyUsage[key] += 1;
    },
    resetUsage: (state) => {
      const newState = getInitialState();
      state.dailyUsage = newState.dailyUsage;
      state.lastUsedDate = newState.lastUsedDate;
    },
  },
});

// Selector to get appropriate limits based on authentication status
export const getLimits = (state) => {
  const isAuthenticated = state.auth?.isAuthenticated || false;
  return isAuthenticated ? null : state.usage.limits.nonAuthenticated;
};

// Selector to check if usage limit is reached for a specific action
export const isUsageLimitReached = (actionType) => (state) => {
  const isAuthenticated = state.auth?.isAuthenticated || false;

  // No limits for authenticated users
  if (isAuthenticated) {
    return false;
  }

  const limits = state.usage.limits.nonAuthenticated || {};
  const currentUsage = state.usage.dailyUsage[actionType] ?? 0;
  const limit = limits[actionType] ?? 0;
  return currentUsage >= limit;
};

export const { incrementUsage, resetUsage } = usageSlice.actions;
export default usageSlice.reducer;