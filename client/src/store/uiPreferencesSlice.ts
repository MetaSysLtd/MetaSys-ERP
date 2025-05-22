
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from '@/lib/queryClient';

interface UiPreferences {
  sidebarPinned: boolean;
  sidebarCollapsed: boolean;
  expandedDropdown: string | null;
  // Animation preferences
  animationsEnabled: boolean;
  transitionSpeed: 'fast' | 'normal' | 'slow';
  pageTransition: 'fade' | 'slide' | 'zoom' | 'gradient';
  reducedMotion: boolean;
}

const initialState: UiPreferences = {
  sidebarPinned: true,
  sidebarCollapsed: false,
  expandedDropdown: null,
  // Animation defaults - animations disabled by default to ensure content renders
  animationsEnabled: false,
  transitionSpeed: 'normal',
  pageTransition: 'fade',
  reducedMotion: false
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
    setPreferences: (state, action: PayloadAction<Partial<UiPreferences>>) => {
      if (action.payload.sidebarPinned !== undefined) {
        state.sidebarPinned = action.payload.sidebarPinned;
      }
      if (action.payload.sidebarCollapsed !== undefined) {
        state.sidebarCollapsed = action.payload.sidebarCollapsed;
      }
      if (action.payload.expandedDropdown !== undefined) {
        state.expandedDropdown = action.payload.expandedDropdown;
      }
      // Animation preferences
      if (action.payload.animationsEnabled !== undefined) {
        state.animationsEnabled = action.payload.animationsEnabled;
      }
      if (action.payload.transitionSpeed !== undefined) {
        state.transitionSpeed = action.payload.transitionSpeed;
      }
      if (action.payload.pageTransition !== undefined) {
        state.pageTransition = action.payload.pageTransition;
      }
      if (action.payload.reducedMotion !== undefined) {
        state.reducedMotion = action.payload.reducedMotion;
      }
    },
    togglePinned: (state) => {
      state.sidebarPinned = !state.sidebarPinned;
    },
    toggleCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    toggleDropdown: (state, action: PayloadAction<string>) => {
      state.expandedDropdown = state.expandedDropdown === action.payload ? null : action.payload;
    }
  }
});

export const { setPreferences, togglePinned, toggleCollapsed, toggleDropdown } = uiPreferencesSlice.actions;
export default uiPreferencesSlice.reducer;

/**
 * Helper function for saving animation settings to Redux store and server
 */
export const saveAnimationSettings = (settings: {
  animationsEnabled?: boolean;
  transitionSpeed?: 'fast' | 'normal' | 'slow';
  pageTransition?: 'fade' | 'slide' | 'zoom' | 'gradient';
  reducedMotion?: boolean;
}) => async (dispatch: any) => {
  try {
    // This will update both the Redux store and the server
    await dispatch(updatePreferences(settings));
    return true;
  } catch (error) {
    console.error('Failed to save animation settings:', error);
    return false;
  }
};

// Thunks for asynchronous operations
export const fetchPreferences = () => async (dispatch: any) => {
  try {
    const response = await apiRequest('GET', '/api/ui-prefs/me');
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
    // Animation preferences
    if (preferences.animationsEnabled !== undefined && preferences.animationsEnabled !== currentState.animationsEnabled) {
      updates.animationsEnabled = preferences.animationsEnabled;
    }
    if (preferences.transitionSpeed !== undefined && preferences.transitionSpeed !== currentState.transitionSpeed) {
      updates.transitionSpeed = preferences.transitionSpeed;
    }
    if (preferences.pageTransition !== undefined && preferences.pageTransition !== currentState.pageTransition) {
      updates.pageTransition = preferences.pageTransition;
    }
    if (preferences.reducedMotion !== undefined && preferences.reducedMotion !== currentState.reducedMotion) {
      updates.reducedMotion = preferences.reducedMotion;
    }
    
    // Only make API call if there are actual changes
    if (Object.keys(updates).length > 0) {
      // Apply local update immediately for responsive UI
      dispatch(setPreferences({ ...currentState, ...updates }));
      
      // Send update to server
      const response = await apiRequest('PATCH', '/api/ui-prefs/me', updates);
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

/**
 * Toggle sidebar dropdown expanded state and sync with local storage
 */
export const syncToggleDropdown = (name: string) => (dispatch: any, getState: any) => {
  dispatch(toggleDropdown(name));
  
  // We don't need to sync this with the server as it's more of a UI state
  // Just store in localStorage for persistence across page refreshes
  try {
    const state = getState().uiPreferences;
    localStorage.setItem('metasys_expanded_dropdown', state.expandedDropdown || '');
  } catch (error) {
    console.error('Failed to save dropdown state to localStorage:', error);
  }
};
