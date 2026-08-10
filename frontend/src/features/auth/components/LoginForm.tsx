import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { client } from '../../../api/client';
import { Mail, KeyRound, ArrowRight } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export const LoginForm: FC = () => {
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
    <div className="bg-white py-8 px-4 border border-neutral-border sm:rounded-xl sm:px-10">
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-md bg-status-occupied/10 p-4 border border-status-occupied/20"
          >
            <div className="text-sm font-medium text-status-occupied">{error}</div>
          </div>
        )}

        <Input
          id="login-email"
          type="email"
          label="Email Address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4 stroke-[1.5]" aria-hidden="true" />}
          placeholder="name@company.com"
          autoComplete="email"
          required
        />

        <Input
          id="login-password"
          type="password"
          label="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          leftIcon={<KeyRound className="h-4 w-4 stroke-[1.5]" aria-hidden="true" />}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        <Button type="submit" variant="primary" isLoading={loading} className="w-full">
          {loading ? 'Signing in...' : 'Continue'}
          {!loading && <ArrowRight className="w-4 h-4 stroke-[2]" aria-hidden="true" />}
        </Button>
      </form>
    </div>
  );
};
