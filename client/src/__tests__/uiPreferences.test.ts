import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import uiPreferencesReducer from '../store/uiPreferencesSlice';
import { Sidebar } from '../components/layout/Sidebar';
import { Logo } from '../components/ui/logo';

describe('UI Preferences Slice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        uiPreferences: uiPreferencesReducer
      }
    });
  });

  it('should have sidebarCollapsed=false by default', () => {
    const state = store.getState().uiPreferences;
    expect(state.sidebarCollapsed).toBe(false);
  });

  it('should toggle collapsed state on PATCH response', () => {
    store.dispatch({ type: 'uiPreferences/toggleCollapsed' });
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

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
  });

  it('should have correct width when collapsed', () => {
    store.dispatch({ type: 'uiPreferences/toggleCollapsed' });
    const { container } = render(
      <Provider store={store}>
        <Sidebar mobile={false} />
      </Provider>
    );
    expect(container.firstChild).toHaveStyle({ width: '64px' });
  });

  it('should auto-hide sidebar on mobile when link clicked', () => {
    Object.defineProperty(window, 'innerWidth', { value: 767 });
    const { getByText } = render(
      <Provider store={store}>
        <Sidebar mobile={true} />
      </Provider>
    );

    const link = getByText('Dashboard');
    fireEvent.click(link);
    expect(store.getState().uiPreferences.sidebarCollapsed).toBe(true);
  });
});

describe('Logo Navigation', () => {
  it('should route admin to admin dashboard', () => {
    const mockUser = { role: { department: 'admin' } };
    vi.mock('@/hooks/use-auth', () => ({
      useAuth: () => ({ user: mockUser })
    }));

    const { container } = render(<Logo />);
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/admin/dashboard');
  });

  it('should route non-admin to main dashboard', () => {
    const mockUser = { role: { department: 'sales' } };
    vi.mock('@/hooks/use-auth', () => ({
      useAuth: () => ({ user: mockUser })
    }));

    const { container } = render(<Logo />);
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/dashboard');
  });
});
import { render } from '@testing-library/react';
import { Button } from '../components/ui/button';

describe('Brand Styling', () => {
  it('button should have correct brand styles', () => {
    const { container } = render(<Button>Test Button</Button>);
    const button = container.firstChild as HTMLElement;
    
    expect(button.className).toContain('bg-[#457B9D]');
    expect(button.className).toContain('hover:bg-[#2EC4B6]');
    expect(button.className).toContain('text-white');
    expect(button.className).toContain('rounded-md');
    expect(button.className).toContain('duration-200');
  });

  it('sidebar should have correct brand background', () => {
    const { container } = render(<Sidebar />);
    const sidebar = container.firstChild as HTMLElement;
    
    expect(sidebar.className).toContain('bg-[#0B1D2F]');
  });
});
