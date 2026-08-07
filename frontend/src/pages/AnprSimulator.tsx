import type { FC } from 'react';
import { AnprFeature } from '../features/anpr/components/AnprFeature';

export const AnprSimulator: FC = () => {
  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">ANPR Camera Simulator</h1>
        <p className="text-neutral-secondary text-sm mt-1">
          Use any connected camera — including <strong>iVCam</strong> — to scan license plates in
          real time
        </p>
      </div>
      <AnprFeature />
    </>
  );
};
