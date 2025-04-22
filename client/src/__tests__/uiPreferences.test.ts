
import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import uiPreferencesReducer, { setPreferences, togglePinned, toggleCollapsed } from '../store/uiPreferencesSlice';

describe('UI Preferences Slice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        uiPreferences: uiPreferencesReducer
      }
    });
  });
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

  describe('Sidebar Toggle Integration', () => {
    it('should properly toggle pin state', () => {
      store.dispatch(togglePinned());
      expect(store.getState().uiPreferences.sidebarPinned).toBe(false);
      store.dispatch(togglePinned());
      expect(store.getState().uiPreferences.sidebarPinned).toBe(true);
    });

    it('should properly toggle collapse state', () => {
      store.dispatch(toggleCollapsed());
      expect(store.getState().uiPreferences.sidebarCollapsed).toBe(true);
      store.dispatch(toggleCollapsed());
      expect(store.getState().uiPreferences.sidebarCollapsed).toBe(false);
    });

    it('should maintain independent toggle states', () => {
      store.dispatch(togglePinned());
      store.dispatch(toggleCollapsed());
      expect(store.getState().uiPreferences.sidebarPinned).toBe(false);
      expect(store.getState().uiPreferences.sidebarCollapsed).toBe(true);
    });
  });

    const actual = uiPreferencesReducer(initialState, togglePinned());
    expect(actual.sidebarPinned).toEqual(false);
  });

  it('should handle toggleCollapsed', () => {
    const actual = uiPreferencesReducer(initialState, toggleCollapsed());
    expect(actual.sidebarCollapsed).toEqual(true);
  });
});
