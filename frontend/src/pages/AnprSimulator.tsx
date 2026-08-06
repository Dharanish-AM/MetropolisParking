import type { FC } from 'react';
import { Navbar } from '../components/Navbar';
import { AnprFeature } from '../features/anpr/components/AnprFeature';

export const AnprSimulator: FC = () => {
  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-primary flex flex-col font-sans">
      <Navbar />
      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in"
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">ANPR Camera Simulator</h1>
          <p className="text-neutral-secondary text-sm mt-1">
            Use any connected camera — including <strong>iVCam</strong> — to scan license plates in
            real time
          </p>
        </div>
        <AnprFeature />
      </main>
    </div>
  );
};
