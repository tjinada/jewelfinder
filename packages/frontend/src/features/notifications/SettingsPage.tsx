import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, RefreshCw, Send, ShieldCheck, Check, X, MapPin } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button, LocationInput } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateProfile, getErrorMessage, GoogleConnectionCard } from '@/features/auth';
import { cn } from '@/lib/utils';
import {
  loadPushDiagnostics,
  subscribeToPush,
  disablePush,
  sendTestNotification,
  type PushDiagnostics,
  type TestResult,
} from './push';
import { useAdminNotificationOverview } from './api';

function StatusRow({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="flex items-center justify-between border-b border-line/60 py-2.5 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span
        className={cn(
          'font-semibold',
          tone === 'good' && 'text-available',
          tone === 'bad' && 'text-accent',
          !tone && 'text-ink',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ProfileCard() {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const [location, setLocation] = useState(user?.location ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const dirty = location.trim() !== (user?.location ?? '').trim();

  const onSave = async () => {
    setError('');
    setSaved(false);
    try {
      await update.mutateAsync({ location: location.trim() });
      setSaved(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold text-ink">Profile</h2>
      </div>

      <label
        htmlFor="profile-location"
        className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted"
      >
        Location
      </label>
      <div className="flex gap-2">
        <LocationInput
          id="profile-location"
          className="flex-1"
          value={location}
          onChange={(v) => {
            setLocation(v);
            setSaved(false);
          }}
        />
        <Button onClick={onSave} disabled={update.isPending || !dirty}>
          {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted">
        Used as the default location when you post an item — you can still change it on each item.
      </p>

      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
      {saved && !error && <p className="mt-2 text-sm text-available">Location updated.</p>}
    </div>
  );
}

function NotificationsCard() {
  const [diag, setDiag] = useState<PushDiagnostics | null>(null);
  const [busy, setBusy] = useState<null | 'enable' | 'disable' | 'test'>(null);
  const [test, setTest] = useState<{ configured: boolean; results: TestResult[] } | null>(null);
  const [msg, setMsg] = useState('');

  const refresh = async () => setDiag(await loadPushDiagnostics());
  useEffect(() => {
    void refresh();
  }, []);

  const onEnable = async () => {
    setBusy('enable');
    setMsg('');
    setTest(null);
    try {
      const ok = await subscribeToPush();
      setMsg(
        ok
          ? 'Notifications enabled on this device.'
          : 'Couldn’t enable — permission was denied, or push isn’t available here.',
      );
    } catch {
      setMsg('Something went wrong enabling notifications.');
    } finally {
      await refresh();
      setBusy(null);
    }
  };

  const onDisable = async () => {
    setBusy('disable');
    setMsg('');
    setTest(null);
    try {
      await disablePush();
      setMsg('Notifications turned off on this device.');
    } finally {
      await refresh();
      setBusy(null);
    }
  };

  const onTest = async () => {
    setBusy('test');
    setMsg('');
    try {
      setTest(await sendTestNotification());
    } finally {
      setBusy(null);
    }
  };

  if (!diag) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const connected = diag.subscribedHere && diag.keyMatchesHere;
  const stale = diag.subscribedHere && !diag.keyMatchesHere;
  const blocked = diag.permission === 'denied';

  const permissionLabel =
    diag.permission === 'granted'
      ? 'Allowed'
      : diag.permission === 'denied'
        ? 'Blocked'
        : diag.permission === 'unsupported'
          ? 'Unsupported'
          : 'Not asked yet';

  const deviceLabel = !diag.subscribedHere
    ? 'Not connected'
    : diag.keyMatchesHere
      ? 'Connected'
      : 'Needs reconnect';

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold text-ink">Notifications</h2>
      </div>

      <div className="mb-4">
        <StatusRow
          label="This browser"
          value={diag.supported ? 'Supported' : 'Not supported'}
          tone={diag.supported ? 'good' : 'bad'}
        />
        <StatusRow
          label="Server push"
          value={diag.serverConfigured ? 'Enabled' : 'Not set up'}
          tone={diag.serverConfigured ? 'good' : 'bad'}
        />
        <StatusRow
          label="Permission"
          value={permissionLabel}
          tone={diag.permission === 'granted' ? 'good' : diag.permission === 'denied' ? 'bad' : undefined}
        />
        <StatusRow
          label="This device"
          value={deviceLabel}
          tone={connected ? 'good' : stale ? 'bad' : undefined}
        />
        <StatusRow label="Devices registered (you)" value={String(diag.deviceCount)} />
      </div>

      {blocked ? (
        <p className="rounded-xl bg-[#F6E1E6] px-4 py-3 text-sm text-accent">
          Notifications are blocked for this site in your browser/OS settings. Re-allow them there,
          then reload and come back.
        </p>
      ) : !diag.supported ? (
        <p className="rounded-xl bg-cream px-4 py-3 text-sm text-muted">
          This browser can’t do web push. On iPhone, add the app to your Home Screen first, then open
          it from there.
        </p>
      ) : !diag.serverConfigured ? (
        <p className="rounded-xl bg-cream px-4 py-3 text-sm text-muted">
          Push isn’t configured on the server yet (no VAPID keys). An admin needs to set those before
          notifications can work.
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {!connected && (
            <Button variant="gold" onClick={onEnable} disabled={busy !== null} className="w-full sm:w-auto">
              {busy === 'enable' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : stale ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {stale ? 'Reconnect this device' : 'Enable notifications'}
            </Button>
          )}

          {diag.subscribedHere && (
            <Button onClick={onTest} disabled={busy !== null} className="w-full sm:w-auto">
              {busy === 'test' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send test notification
            </Button>
          )}

          {diag.subscribedHere && (
            <Button
              variant="ghost"
              onClick={onDisable}
              disabled={busy !== null}
              className="w-full border-accent/40 text-accent hover:bg-accent/10 sm:w-auto"
            >
              <BellOff className="h-4 w-4" /> Turn off here
            </Button>
          )}
        </div>
      )}

      {msg && <p className="mt-3 text-sm text-ink/80">{msg}</p>}

      {test && (
        <div className="mt-4 rounded-xl border border-line bg-cream/60 p-3 text-sm">
          {!test.configured ? (
            <p className="text-muted">Server push is disabled — no VAPID keys configured.</p>
          ) : test.results.length === 0 ? (
            <p className="text-muted">No devices registered to test. Tap “Enable notifications” first.</p>
          ) : (
            <>
              <p className="mb-2 font-semibold text-ink">Test results</p>
              <ul className="space-y-1.5">
                {test.results.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {r.ok ? (
                      <Check className="mt-0.5 h-4 w-4 flex-none text-available" />
                    ) : (
                      <X className="mt-0.5 h-4 w-4 flex-none text-accent" />
                    )}
                    <span className="text-ink/80">
                      {r.endpoint} —{' '}
                      {r.ok ? 'delivered' : `failed${r.statusCode ? ` (${r.statusCode})` : ''}`}
                      {r.error ? `: ${r.error}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
              {test.results.some((r) => r.statusCode === 403 || r.statusCode === 401) && (
                <p className="mt-2 text-xs text-muted">
                  A 401/403 means this device was registered with a different server key. Tap
                  “Reconnect this device” to fix it.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AdminCard() {
  const overview = useAdminNotificationOverview(true);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold text-ink">Who has notifications on</h2>
      </div>

      {overview.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : overview.isError ? (
        <p className="py-6 text-center font-display text-sm italic text-muted">Couldn’t load the overview.</p>
      ) : (
        <ul className="divide-y divide-line/60">
          {overview.data?.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{u.displayName}</p>
                <p className="truncate text-xs text-muted">{u.email}</p>
              </div>
              <div className="flex flex-none items-center gap-2">
                {!u.messagesEnabled && (
                  <span className="rounded-full bg-gold-light px-2 py-0.5 text-[11px] font-semibold text-[#7a5a1a]">
                    muted
                  </span>
                )}
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                    u.deviceCount > 0 ? 'bg-[#E2F0EA] text-available' : 'bg-line text-muted',
                  )}
                >
                  {u.deviceCount > 0 ? `On · ${u.deviceCount}` : 'Off'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">
        “On” means the person has at least one device registered for push. “muted” means they’ve
        switched message notifications off in their own preferences.
      </p>
    </div>
  );
}

export function SettingsPage() {
  const isAdmin = !!useAuthStore((s) => s.user?.isAdmin);

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 font-display text-2xl text-ink md:text-3xl">Settings</h1>
        <div className="flex flex-col gap-4">
          <ProfileCard />
          <GoogleConnectionCard />
          <NotificationsCard />
          {isAdmin && <AdminCard />}
        </div>
      </div>
    </MainLayout>
  );
}
