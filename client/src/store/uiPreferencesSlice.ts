
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from '@/lib/queryClient';

interface UiPreferences {
  sidebarPinned: boolean;
  sidebarCollapsed: boolean;
}

const initialState: UiPreferences = {
  sidebarPinned: true,
  sidebarCollapsed: false
};

/**
 * UI Preferences Slice
 * 
 * Handles UI preference state management including:
 * - Sidebar pinned state (sticky / expanded)
 * - Sidebar collapsed state (collapsed on desktop)
 * 
 * Syncs with server via API and shares updates across tabs via socket.io
 */
const uiPreferencesSlice = createSlice({
  name: 'uiPreferences',
  initialState,
  reducers: {
    setPreferences: (state, action: PayloadAction<UiPreferences>) => {
      state.sidebarPinned = action.payload.sidebarPinned;
      state.sidebarCollapsed = action.payload.sidebarCollapsed;
    },
    togglePinned: (state) => {
      state.sidebarPinned = !state.sidebarPinned;
    },
    toggleCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    }
  }
});

export const { setPreferences, togglePinned, toggleCollapsed } = uiPreferencesSlice.actions;
export default uiPreferencesSlice.reducer;

// Thunks for asynchronous operations
export const fetchPreferences = () => async (dispatch: any) => {
  try {
    const response = await apiRequest('/api/ui-prefs/me', 'GET');
    const data = await response.json();
    dispatch(setPreferences(data));
    return data;
  } catch (error) {
    console.error('Failed to fetch UI preferences:', error);
    return null;
  }
};

/**
 * Update UI preferences on the server and emit socket event for other tabs
 */
export const updatePreferences = (preferences: Partial<UiPreferences>) => async (dispatch: any, getState: any) => {
  try {
    // Get current state
    const currentState = getState().uiPreferences;
    
    // Create a merged object with only the fields that changed
    const updates: Partial<UiPreferences> = {};
    if (preferences.sidebarPinned !== undefined && preferences.sidebarPinned !== currentState.sidebarPinned) {
      updates.sidebarPinned = preferences.sidebarPinned;
    }
    if (preferences.sidebarCollapsed !== undefined && preferences.sidebarCollapsed !== currentState.sidebarCollapsed) {
      updates.sidebarCollapsed = preferences.sidebarCollapsed;
    }
    
    // Only make API call if there are actual changes
    if (Object.keys(updates).length > 0) {
      // Apply local update immediately for responsive UI
      dispatch(setPreferences({ ...currentState, ...updates }));
      
      // Send update to server
      const response = await apiRequest('/api/ui-prefs/me', 'PATCH', updates);
      const data = await response.json();
      
      // Server may return additional fields or normalized values
      dispatch(setPreferences(data));
      return data;
    }
    
    return currentState;
  } catch (error) {
    console.error('Failed to update UI preferences:', error);
    return null;
  }
};

/**
 * Toggle sidebar pinned state and sync with server
 */
export const syncTogglePinned = () => async (dispatch: any, getState: any) => {
  dispatch(togglePinned());
  const state = getState().uiPreferences;
  dispatch(updatePreferences({ sidebarPinned: state.sidebarPinned }));
};

/**
 * Toggle sidebar collapsed state and sync with server
 */
export const syncToggleCollapsed = () => async (dispatch: any, getState: any) => {
  dispatch(toggleCollapsed());
  const state = getState().uiPreferences;
  dispatch(updatePreferences({ sidebarCollapsed: state.sidebarCollapsed }));
};
