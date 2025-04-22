
import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../db';
import { uiPreferences } from '@shared/schema';

describe('UI Preferences', () => {
  beforeAll(async () => {
    // Clean up test data
    await db.delete(uiPreferences).where(eq(uiPreferences.userId, 1));
  });

  it('should create default preferences for new user', async () => {
    const prefs = await db.insert(uiPreferences).values({
      userId: 1,
      sidebarPinned: true,
      sidebarCollapsed: false
    }).returning();

    expect(prefs[0]).toBeDefined();
    expect(prefs[0].sidebarPinned).toBe(true);
    expect(prefs[0].sidebarCollapsed).toBe(false);
  });

  it('should update preferences', async () => {
    const updated = await db.update(uiPreferences)
      .set({ sidebarCollapsed: true })
      .where(eq(uiPreferences.userId, 1))
      .returning();

    expect(updated[0].sidebarCollapsed).toBe(true);
  });
});
