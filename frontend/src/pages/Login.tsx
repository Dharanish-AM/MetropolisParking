import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { client } from '../api/client';
import { Mail, KeyRound, ArrowRight } from 'lucide-react';
import { theme } from '../styles/theme';
import { MetropolisLogo } from '../components/MetropolisLogo';

export const Login: FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await client.post('/auth/login', { email, password });
      login(response.data.token, response.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <MetropolisLogo size="lg" className="justify-center mb-6" />
        <h2 className="text-3xl font-extrabold text-neutral-primary tracking-tight">
          Welcome to Metropolis
        </h2>
        <p className="mt-2 text-sm text-neutral-secondary">
          Enter your credentials to access the Metropolis parking network.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-neutral-border sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-100">
                <div className="text-sm font-medium text-red-800">{error}</div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-neutral-primary mb-2">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-secondary">
                  <Mail className="h-5 h-5 stroke-[1.5]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`${theme.components.input} pl-10`}
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-primary mb-2">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-secondary">
                  <KeyRound className="h-5 h-5 stroke-[1.5]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`${theme.components.input} pl-10`}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading} className={theme.components.buttonPrimary}>
                {loading ? 'Signing in...' : 'Continue'}
                {!loading && <ArrowRight className="w-4 h-4 stroke-[2]" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
