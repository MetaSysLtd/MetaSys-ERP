import React from 'react';
import { GamificationDashboard } from '@/components/gamification/GamificationDashboard';
import { AnimationProvider } from '@/contexts/AnimationContext';

export default function GamificationPage() {
  return (
    <AnimationProvider>
      <GamificationDashboard />
    </AnimationProvider>
  );
}