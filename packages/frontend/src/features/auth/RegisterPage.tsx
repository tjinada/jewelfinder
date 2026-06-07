import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, LocationInput } from '@/components/ui';
import { useRegister, getErrorMessage } from './useAuth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { AuthShell, inputClass, labelClass } from './AuthShell';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const [params] = useSearchParams();
  // Arrived from a closet invite link? Return there after sign-up to auto-join.
  const joinToken = params.get('join');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register.mutateAsync({ displayName, email, password, location });
      navigate(joinToken ? `/join/${joinToken}` : '/', { replace: true });
    } catch {
      // error surfaced below
    }
  };

  return (
    <AuthShell>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            required
            maxLength={60}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="location">Location</label>
          <LocationInput id="location" required value={location} onChange={setLocation} />
        </div>

        <div>
          <label className={labelClass} htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="At least 8 characters"
          />
        </div>

        {register.isError && (
          <p className="rounded-lg bg-[#F4E7D5] px-3 py-2 text-sm text-onloan">
            {getErrorMessage(register.error)}
          </p>
        )}

        <Button type="submit" disabled={register.isPending} className="w-full">
          {register.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <GoogleSignInButton
        afterSignIn={() => navigate(joinToken ? `/join/${joinToken}` : '/', { replace: true })}
      />

      <p className="mt-5 text-center text-sm text-ink/70">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
