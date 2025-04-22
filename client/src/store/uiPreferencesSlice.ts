
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

// Thunks
export const fetchPreferences = () => async (dispatch: any) => {
  try {
    const response = await apiRequest('/api/ui-preferences', 'GET');
    const data = await response.json();
    dispatch(setPreferences(data));
  } catch (error) {
    console.error('Failed to fetch UI preferences:', error);
  }
};

export const updatePreferences = (preferences: Partial<UiPreferences>) => async (dispatch: any, getState: any) => {
  try {
    const response = await apiRequest('/api/ui-preferences', 'PUT', preferences);
    const data = await response.json();
    dispatch(setPreferences(data));
  } catch (error) {
    console.error('Failed to update UI preferences:', error);
  }
};
