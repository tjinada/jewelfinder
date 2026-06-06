import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Hanger } from '@/components/icons/Hanger';
import { Button, LocationInput } from '@/components/ui';
import { useRegister, useInviteResolve, getErrorMessage } from './useAuth';
import { AuthShell, inputClass, labelClass } from './AuthShell';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const [params] = useSearchParams();
  const inviteToken = params.get('invite') ?? undefined;
  const invite = useInviteResolve(inviteToken);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');

  // A valid invite locks the email to the invited address so the auto-join
  // (matched by email at sign-up) is guaranteed.
  const invitedValid = !!invite.data && !invite.data.expired;
  useEffect(() => {
    if (invitedValid && invite.data) setEmail(invite.data.email);
  }, [invitedValid, invite.data]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register.mutateAsync({ displayName, email, password, location });
      navigate('/', { replace: true });
    } catch {
      // error surfaced below
    }
  };

  return (
    <AuthShell>
      {invite.data &&
        (invite.data.expired ? (
          <div className="mb-5 rounded-2xl border border-line bg-cream/60 p-4 text-sm text-muted">
            This invite link has expired, but you can still create an account.
          </div>
        ) : (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <Hanger className="mt-0.5 h-5 w-5 flex-none text-primary" />
            <div>
              <p className="text-sm font-semibold text-primary">
                You’re invited to “{invite.data.closetName}”
              </p>
              <p className="mt-0.5 text-xs text-ink/70">
                {invite.data.inviterName} invited you — finish signing up to join.
              </p>
            </div>
          </div>
        ))}

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
            readOnly={invitedValid}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass}${invitedValid ? ' bg-cream/60 text-muted' : ''}`}
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

      <p className="mt-5 text-center text-sm text-ink/70">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
