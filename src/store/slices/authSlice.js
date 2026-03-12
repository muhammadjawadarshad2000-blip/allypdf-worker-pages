import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

// ─── Auth Thunks ────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      // Backend expects 'fullName', UI provides 'name'
      const { data } = await axiosClient.post('/register', {
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
        role: "admin"
      });
      return data.data.user;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/login', formData);
      // The backend returns 202 for new devices with { deviceHash, email }
      // The slice extraReducers will handle the 'requiresVerification' logic
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const verifyDeviceOTP = createAsyncThunk(
  'auth/verifyDeviceOTP',
  async ({ email, code, deviceHash }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/verify-device', {
        email,
        code,
        deviceHash, // Matches backend controller variable name
      });
      return data.data; // Contains tokens and user
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const resendDeviceOTP = createAsyncThunk(
  'auth/resendDeviceOTP',
  async ({ email, deviceHash }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/resend-device-otp', {
        email,
        deviceHash,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/me');
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/logout');
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/forgot-password', { email });
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post(`/reset-password/${token}`, { token, newPassword });
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const changeCurrentPassword = createAsyncThunk(
  'auth/changePassword',
  async ({ oldPassword, newPassword }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/change-password', {
        oldPassword,
        newPassword,
      });
      return data; // Usually returns a success message
    } catch (err) {
      // Returns the error object for the UI to display
      return rejectWithValue(err);
    }
  }
);

// ─── Session & Device Management Thunks ─────────────────────────────────────

export const fetchActiveSessions = createAsyncThunk(
  'auth/fetchSessions',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/sessions');
      return data.data || [];
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const revokeSession = createAsyncThunk(
  'auth/revokeSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      await axiosClient.post(`/sessions/${sessionId}`, { sessionId });
      return sessionId;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const fetchTrustedDevices = createAsyncThunk(
  'auth/fetchTrustedDevices',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/trusted-devices');
      return data.data || [];
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const removeTrustedDevice = createAsyncThunk(
  'auth/removeTrustedDevice',
  async (deviceId, { rejectWithValue }) => {
    try {
      await axiosClient.post(`/trusted-devices/${deviceId}`, { deviceId });
      return deviceId;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

// ─── Initial State ──────────────────────────────────────────────────────────

const storedUser = localStorage.getItem("user");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedUser,
  loading: false,
  sessionLoading: true,
  error: null,

  // Device verification
  requiresVerification: false,
  verificationEmail: null,
  deviceHash: null,
  verifyLoading: false,
  verifyError: null,
  resendLoading: false,
  resendSuccess: false,
  resendError: null,

  // Forgot / reset password
  forgotPasswordLoading: false,
  forgotPasswordSuccess: false,
  resetPasswordLoading: false,
  resetPasswordSuccess: false,

  // Session & device management
  sessions: [],
  sessionsLoading: false,
  trustedDevices: [],
  trustedDevicesLoading: false,

  changePasswordLoading: false,
  changePasswordSuccess: false,
  error: null,
};

// ─── Slice ──────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
      state.verifyError = null;
      state.resendError = null;
    },
    clearVerificationState: (state) => {
      state.requiresVerification = false;
      state.verificationEmail = null;
      state.deviceHash = null;
      state.verifyError = null;
      state.resendSuccess = false;
      state.resendError = null;
    },
    forceLogout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.sessionLoading = false;
      state.error = null;
      state.requiresVerification = false;
      state.verificationEmail = null;
      state.deviceHash = null;
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder

      // ── Register ────────────────────────────────────────────────────
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.sessionLoading = false;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: "Registration failed", details: [] };
      })

      // ── Login (may return requiresVerification) ────────────────────
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.requiresVerification = false;
        state.verificationEmail = null;
        state.deviceHash = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.statusCode === 202) {
          state.requiresVerification = true;
          state.verificationEmail = action.payload.data.email;
          state.deviceHash = action.payload.data.deviceHash;
        } else {
          state.user = action.payload.data.user || action.payload.data;
          state.isAuthenticated = true;
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          message: action.payload?.message || "Login failed",
          details: action.payload?.details || [],
        };
      })

      // ── Verify Device OTP ──────────────────────────────────────────
      .addCase(verifyDeviceOTP.pending, (state) => {
        state.verifyLoading = true;
        state.verifyError = null;
      })
      .addCase(verifyDeviceOTP.fulfilled, (state, action) => {
        state.verifyLoading = false;
        state.requiresVerification = false;
        state.verificationEmail = null;
        state.deviceHash = null;
        state.verifyError = null;

        const user = action.payload?.user || action.payload;
        state.user = user;
        state.isAuthenticated = true;
        state.sessionLoading = false;
        localStorage.setItem("user", JSON.stringify(user));
      })
      .addCase(verifyDeviceOTP.rejected, (state, action) => {
        state.verifyLoading = false;
        state.verifyError = action.payload || { message: "Verification failed", details: [] };
      })

      // ── Resend Device OTP ──────────────────────────────────────────
      .addCase(resendDeviceOTP.pending, (state) => {
        state.resendLoading = true;
        state.resendSuccess = false;
        state.resendError = null;
      })
      .addCase(resendDeviceOTP.fulfilled, (state) => {
        state.resendLoading = false;
        state.resendSuccess = true;
      })
      .addCase(resendDeviceOTP.rejected, (state, action) => {
        state.resendLoading = false;
        state.resendError = action.payload || { message: "Failed to resend code", details: [] };
      })

      // ── Fetch Current User ─────────────────────────────────────────
      .addCase(fetchCurrentUser.pending, (state) => {
        state.sessionLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.sessionLoading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        if (action.payload) localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.sessionLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem("user");
      })

      // ── Logout ─────────────────────────────────────────────────────
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.requiresVerification = false;
        localStorage.removeItem("user");
      })
      .addCase(logoutUser.rejected, (state) => {
        // Clear state even if API call fails
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.requiresVerification = false;
        localStorage.removeItem("user");
      })

      // ── Forgot Password ────────────────────────────────────────────
      .addCase(forgotPassword.pending, (state) => {
        state.forgotPasswordLoading = true;
        state.error = null;
        state.forgotPasswordSuccess = false;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordSuccess = true;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordSuccess = false;
        state.error = action.payload || { message: "Failed to send reset email", details: [] };
      })

      // ── Reset Password ─────────────────────────────────────────────
      .addCase(resetPassword.pending, (state) => {
        state.resetPasswordLoading = true;
        state.error = null;
        state.resetPasswordSuccess = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.resetPasswordLoading = false;
        state.resetPasswordSuccess = true;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordSuccess = false;
        state.error = action.payload || { message: "Failed to reset password", details: [] };
      })

      // ── Fetch Active Sessions ──────────────────────────────────────
      .addCase(fetchActiveSessions.pending, (state) => {
        state.sessionsLoading = true;
      })
      .addCase(fetchActiveSessions.fulfilled, (state, action) => {
        state.sessionsLoading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchActiveSessions.rejected, (state) => {
        state.sessionsLoading = false;
      })

      // ── Revoke Session ─────────────────────────────────────────────
      .addCase(revokeSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter((s) => s._id !== action.payload);
      })

      // ── Fetch Trusted Devices ──────────────────────────────────────
      .addCase(fetchTrustedDevices.pending, (state) => {
        state.trustedDevicesLoading = true;
      })
      .addCase(fetchTrustedDevices.fulfilled, (state, action) => {
        state.trustedDevicesLoading = false;
        state.trustedDevices = action.payload;
      })
      .addCase(fetchTrustedDevices.rejected, (state) => {
        state.trustedDevicesLoading = false;
      })

      // ── Remove Trusted Device ──────────────────────────────────────
      .addCase(removeTrustedDevice.fulfilled, (state, action) => {
        state.trustedDevices = state.trustedDevices.filter((d) => d._id !== action.payload);
      })

      // ── Change Current Password ──────────────────────────────────────
      .addCase(changeCurrentPassword.pending, (state) => {
        state.changePasswordLoading = true;
        state.changePasswordSuccess = false;
        state.error = null;
      })
      .addCase(changeCurrentPassword.fulfilled, (state) => {
        state.changePasswordLoading = false;
        state.changePasswordSuccess = true;
        state.error = null;
      })
      .addCase(changeCurrentPassword.rejected, (state, action) => {
        state.changePasswordLoading = false;
        state.changePasswordSuccess = false;
        state.error = action.payload || { message: "Failed to update password" };
      })
  },
});

export const { clearAuthError, clearVerificationState, forceLogout } = authSlice.actions;
export default authSlice.reducer;