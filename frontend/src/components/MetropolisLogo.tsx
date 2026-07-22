import type { FC } from 'react';

interface MetropolisLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MetropolisLogo: FC<MetropolisLogoProps> = ({ className = '', size = 'md' }) => {
  const dimensions = {
    sm: { width: '26', height: '14', text: 'text-base' },
    md: { width: '34', height: '18', text: 'text-lg' },
    lg: { width: '42', height: '22', text: 'text-2xl' },
  };

  const current = dimensions[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={current.width}
        height={current.height}
        viewBox="0 0 42 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M9.86258 8.34436V21.1859H14.367V8.34889L20.8119 14.764L27.2614 8.34436V21.1859H31.7659V8.34889L38.2107 14.7617L41.5255 11.4625L29.5136 -0.491455L20.8142 8.16773L12.1125 -0.491455L0.103027 11.4625L3.41537 14.7617L9.86258 8.34436Z"
          fill="currentColor"
        />
      </svg>
      <span
        className={`font-extrabold tracking-tight text-neutral-primary lowercase font-sans select-none ${current.text}`}
      >
        metropolis
      </span>
    </div>
  );
};
