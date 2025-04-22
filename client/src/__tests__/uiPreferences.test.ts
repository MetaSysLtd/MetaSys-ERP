import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import uiPreferencesReducer from '../store/uiPreferencesSlice';
import { Sidebar } from '../components/layout/Sidebar';

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
    const actual = uiPreferencesReducer(initialState, togglePinned());
    expect(actual.sidebarPinned).toEqual(false);
  });

  it('should handle toggleCollapsed', () => {
    const actual = uiPreferencesReducer(initialState, toggleCollapsed());
    expect(actual.sidebarCollapsed).toEqual(true);
  });
});

describe('Sidebar Toggle Integration', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        uiPreferences: uiPreferencesReducer
      }
    });
  });

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

describe('Sidebar Responsive Behavior', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        uiPreferences: uiPreferencesReducer
      }
    });
  });

  it('should have correct width when expanded on desktop', () => {
    window.innerWidth = 1024;
    const { container } = render(
      <Provider store={store}>
        <Sidebar mobile={false} />
      </Provider>
    );
    const sidebar = container.firstChild;
    expect(sidebar).toHaveClass('w-60');
  });

  it('should have correct width when collapsed on desktop', () => {
    window.innerWidth = 1024;
    store.dispatch({ type: 'uiPreferences/toggleCollapsed' });
    const { container } = render(
      <Provider store={store}>
        <Sidebar mobile={false} />
      </Provider>
    );
    const sidebar = container.firstChild;
    expect(sidebar).toHaveClass('w-16');
  });

  it('should be fixed position on mobile', () => {
    window.innerWidth = 768;
    const { container } = render(
      <Provider store={store}>
        <Sidebar mobile={true} />
      </Provider>
    );
    const sidebar = container.firstChild;
    expect(sidebar).toHaveClass('fixed');
  });

  it('should auto-collapse on mobile viewport', () => {
    window.innerWidth = 767;
    const { container } = render(
      <Provider store={store}>
        <Sidebar mobile={true} />
      </Provider>
    );
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    const state = store.getState().uiPreferences;
    expect(state.sidebarCollapsed).toBe(true);
  });

  it('should collapse when clicking links on mobile', () => {
    window.innerWidth = 767;
    const { container, getByText } = render(
      <Provider store={store}>
        <Sidebar mobile={true} />
      </Provider>
    );
    
    const link = getByText('Dashboard');
    fireEvent.click(link);
    
    const state = store.getState().uiPreferences;
    expect(state.sidebarCollapsed).toBe(true);
  });
});