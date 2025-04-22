
import { describe, it, expect } from 'vitest';
import uiPreferencesReducer, { setPreferences, togglePinned, toggleCollapsed } from '../store/uiPreferencesSlice';

describe('UI Preferences Slice', () => {
  const initialState = {
    sidebarPinned: true,
    sidebarCollapsed: false
  };

  it('should handle initial state', () => {
    expect(uiPreferencesReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setPreferences', () => {
    const actual = uiPreferencesReducer(initialState, setPreferences({
      sidebarPinned: false,
      sidebarCollapsed: true
    }));
    expect(actual.sidebarPinned).toEqual(false);
    expect(actual.sidebarCollapsed).toEqual(true);
  });

  it('should handle togglePinned', () => {
    const actual = uiPreferencesReducer(initialState, togglePinned());
    expect(actual.sidebarPinned).toEqual(false);
  });

  it('should handle toggleCollapsed', () => {
    const actual = uiPreferencesReducer(initialState, toggleCollapsed());
    expect(actual.sidebarCollapsed).toEqual(true);
  });
});
