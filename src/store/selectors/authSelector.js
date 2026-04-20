export const selectAuthState = (state) => {
  // Check admin auth first (mirrors mobile logic)
  if (state.adminAuth?.token && state.adminAuth?.admin) {
    return {
      token:          state.adminAuth.token,
      role:           'Admin',
      user:           state.adminAuth.admin,
      loading:        state.adminAuth.loading || false,
      error:          state.adminAuth.error || null,
      isCheckingAuth: state.adminAuth.isCheckingAuth || false,
    };
  }
  // Regular user
  if (state.auth?.token && state.auth?.user) {
    return {
      token:          state.auth.token,
      role:           state.auth.user.role || null,
      user:           state.auth.user,
      loading:        state.auth.loading || false,
      error:          state.auth.error || null,
      isCheckingAuth: state.auth.isCheckingAuth || false,
    };
  }
  return {
    token:          null,
    role:           null,
    user:           null,
    loading:        false,
    error:          null,
    isCheckingAuth: state.auth?.isCheckingAuth || false,
  };
};
