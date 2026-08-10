import type { FC } from 'react';
import { MetropolisLogo } from '../components/MetropolisLogo';
import { LoginForm } from '../features/auth/components/LoginForm';

export const Login: FC = () => {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-neutral-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <MetropolisLogo size="lg" className="justify-center mb-6" />
        <h1 className="text-3xl font-extrabold text-neutral-primary tracking-tight">
          Welcome to Metropolis
        </h1>
        <p className="mt-2 text-sm text-neutral-secondary">
          Enter your credentials to access the Metropolis parking network.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
      </div>
    </main>
  );
};
