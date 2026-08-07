import type { FC } from 'react';
import { Navbar } from '../components/Navbar';
import { PricingRulesFeature } from '../features/pricing/PricingRulesFeature';

export const PricingPage: FC = () => {
  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-primary flex flex-col font-sans">
      <Navbar />
      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in"
      >
        <PricingRulesFeature />
      </main>
    </div>
  );
};
