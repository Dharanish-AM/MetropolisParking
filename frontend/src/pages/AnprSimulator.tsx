import type { FC } from 'react';
import { AnprFeature } from '../features/anpr/components/AnprFeature';

export const AnprSimulator: FC = () => {
  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-primary">
          ANPR Camera Simulator
        </h1>
        <p className="text-neutral-secondary text-sm font-medium mt-1">
          Simulate automatic number plate recognition for entry and exit gates.
        </p>
      </div>
      <AnprFeature />
    </>
  );
};
