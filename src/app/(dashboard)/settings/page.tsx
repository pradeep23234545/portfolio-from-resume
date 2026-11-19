'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    User, Upload, Save, ShieldCheck, KeyRound, LogOut, Trash2, Github, Loader2, CheckCircle2, AlertCircle, Monitor, CalendarDays, Mail,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getProfile, updateProfile, changePassword, deleteAccount, type ProfileDetails, type AccountInfo } from '@/actions/settings';
import { PROFILE_UPDATED_EVENT } from '@/components/dashboard/Header';
import { refreshNotifications } from '@/components/dashboard/NotificationBell';

type Status = { kind: 'success' | 'error'; text: string } | null;

function StatusLine({ status }: { status: Status }) {
    if (!status) return null;
    const ok = status.kind === 'success';
    return (
        <p role="status" className={`flex items-center gap-1.5 text-sm ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {status.text}
        </p>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>
            {children}
            {hint && <span className="block text-xs text-slate-500">{hint}</span>}
        </label>
    );
}

const formatDate = (iso: string | null | undefined, withTime = false) =>
    iso ? new Date(iso).toLocaleString(undefined, withTime
        ? { dateStyle: 'medium', timeStyle: 'short' }
        : { dateStyle: 'long' }) : '—';

const EMPTY: ProfileDetails = { fullName: '', avatarUrl: '', headline: '', bio: '', phone: '', location: '', website: '', linkedin: '' };

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileDetails>(EMPTY);
    const [account, setAccount] = useState<AccountInfo | null>(null);
    const [saving, setSaving] = useState(false);
    const [profileStatus, setProfileStatus] = useState<Status>(null);
    const [uploading, setUploading] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
    const [pwStatus, setPwStatus] = useState<Status>(null);
    const [pwSaving, setPwSaving] = useState(false);

    const [confirmEmail, setConfirmEmail] = useState('');
    const [deleteStatus, setDeleteStatus] = useState<Status>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        getProfile().then(res => {
            if (res) { setProfile(res.profile); setAccount(res.account); }
        }).finally(() => setLoading(false));
    }, []);

    // /settings#account from the header menu
    useEffect(() => {
        if (!loading && window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView({ behavior: 'smooth' });
    }, [loading]);

    const set = (patch: Partial<ProfileDetails>) => setProfile(p => ({ ...p, ...patch }));

    const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploading(true);
        setProfileStatus(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload/avatar', { method: 'POST', body: fd });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Upload failed');
            set({ avatarUrl: json.url });
            setProfileStatus({ kind: 'success', text: 'Photo uploaded. Click Save profile to keep it.' });
        } catch (err) {
            setProfileStatus({ kind: 'error', text: err instanceof Error ? err.message : 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        setProfileStatus(null);
        const res = await updateProfile(profile);
        setSaving(false);
        if ('error' in res) return setProfileStatus({ kind: 'error', text: res.error });
        setProfileStatus({ kind: 'success', text: 'Profile saved.' });
        window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
        refreshNotifications();
    };

    const savePassword = async () => {
        setPwStatus(null);
        if (pw.next !== pw.confirm) return setPwStatus({ kind: 'error', text: 'The new passwords do not match.' });
        setPwSaving(true);
        const res = await changePassword(pw.current, pw.next);
        setPwSaving(false);
        if ('error' in res) return setPwStatus({ kind: 'error', text: res.error });
        setPw({ current: '', next: '', confirm: '' });
        setPwStatus({ kind: 'success', text: 'Password changed.' });
        refreshNotifications();
    };

    const removeAccount = async () => {
        setDeleting(true);
        setDeleteStatus(null);
        const res = await deleteAccount(confirmEmail);
        if ('error' in res) {
            setDeleting(false);
            return setDeleteStatus({ kind: 'error', text: res.error });
        }
        window.location.href = '/signup';
    };

    const signOut = async () => {
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        window.location.href = '/login';
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto flex items-center gap-2 py-20 justify-center text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading your profile…
            </div>
        );
    }

    const initials = (profile.fullName || account?.email || '?').split(/[\s@]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
            {/* Identity header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="relative h-20 w-20 shrink-0">
                    {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- avatar hosts vary
                        <img src={profile.avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover border-4 border-white shadow" />
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white shadow">{initials}</div>
                    )}
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{profile.fullName || 'Your profile'}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{account?.email}</span>
                        <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Member since {formatDate(account?.createdAt)}</span>
                    </p>
                </div>
            </div>

            {/* Personal details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-indigo-600" /> Personal details</CardTitle>
                    <CardDescription>
                        Details of your account. Your portfolio&apos;s content is edited separately in{' '}
                        <Link href="/customize" className="text-indigo-600 hover:underline">Customize</Link>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="flex items-center gap-3">
                        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                        <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} loading={uploading} leftIcon={<Upload className="h-4 w-4" />}>
                            {profile.avatarUrl ? 'Change photo' : 'Upload photo'}
                        </Button>
                        {profile.avatarUrl && (
                            <Button variant="ghost" size="sm" onClick={() => set({ avatarUrl: '' })}>Remove photo</Button>
                        )}
                        <span className="text-xs text-slate-500">JPG or PNG, up to 2 MB</span>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Full name">
                            <Input value={profile.fullName} onChange={e => set({ fullName: e.target.value })} autoComplete="name" />
                        </Field>
                        <Field label="Headline" hint="e.g. Computer Science student">
                            <Input value={profile.headline} onChange={e => set({ headline: e.target.value })} />
                        </Field>
                        <Field label="Phone">
                            <Input value={profile.phone} onChange={e => set({ phone: e.target.value })} type="tel" autoComplete="tel" />
                        </Field>
                        <Field label="Location" hint="City, Country">
                            <Input value={profile.location} onChange={e => set({ location: e.target.value })} autoComplete="address-level2" />
                        </Field>
                        <Field label="Website">
                            <Input value={profile.website} onChange={e => set({ website: e.target.value })} placeholder="https://" type="url" />
                        </Field>
                        <Field label="LinkedIn">
                            <Input value={profile.linkedin} onChange={e => set({ linkedin: e.target.value })} placeholder="linkedin.com/in/…" />
                        </Field>
                    </div>
                    <Field label="About you" hint="A few lines about yourself (private to your account).">
                        <Textarea value={profile.bio} onChange={e => set({ bio: e.target.value })} rows={4} />
                    </Field>
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
                    <StatusLine status={profileStatus} />
                    <Button variant="primary" className="ml-auto" onClick={saveProfile} loading={saving} leftIcon={<Save className="h-4 w-4" />}>
                        Save profile
                    </Button>
                </CardFooter>
            </Card>

            {/* Account */}
            <Card id="account" className="scroll-mt-24">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-indigo-600" /> Account</CardTitle>
                    <CardDescription>Sign-in details and recent activity on your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                        <div>
                            <dt className="text-slate-500">Email (used to sign in)</dt>
                            <dd className="font-medium text-slate-900 dark:text-white break-all">{account?.email}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Account ID</dt>
                            <dd className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all">{account?.id}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Last sign-in</dt>
                            <dd className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                                <Monitor className="h-4 w-4 text-slate-400" />
                                {account?.lastSignIn ? `${formatDate(account.lastSignIn.at, true)} · ${account.lastSignIn.device}` : 'This session'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Previous sign-in</dt>
                            <dd className="font-medium text-slate-900 dark:text-white">
                                {account?.previousSignIn ? `${formatDate(account.previousSignIn.at, true)} · ${account.previousSignIn.device}` : '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">GitHub</dt>
                            <dd className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                                <Github className="h-4 w-4" />
                                {account?.githubUsername ? `@${account.githubUsername}` : 'Not connected'}
                                <Link href="/connect" className="ml-1 text-xs font-normal text-indigo-600 hover:underline">Manage</Link>
                            </dd>
                        </div>
                    </dl>
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 flex justify-end">
                    <Button variant="outline" onClick={signOut} leftIcon={<LogOut className="h-4 w-4" />}>Sign out</Button>
                </CardFooter>
            </Card>

            {/* Password */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-indigo-600" /> Change password</CardTitle>
                    <CardDescription>Use at least 8 characters.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 sm:grid-cols-3">
                    <Field label="Current password">
                        <Input type="password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
                    </Field>
                    <Field label="New password">
                        <Input type="password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
                    </Field>
                    <Field label="Confirm new password">
                        <Input type="password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
                    </Field>
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
                    <StatusLine status={pwStatus} />
                    <Button variant="outline" className="ml-auto" onClick={savePassword} loading={pwSaving}
                        disabled={!pw.current || !pw.next || !pw.confirm}>
                        Update password
                    </Button>
                </CardFooter>
            </Card>

            {/* Danger zone */}
            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600"><Trash2 className="h-5 w-5" /> Delete account</CardTitle>
                    <CardDescription>
                        Permanently deletes your account, portfolio, uploads and notifications. This cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Field label={`Type ${account?.email} to confirm`}>
                        <Input value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} autoComplete="off" />
                    </Field>
                    <StatusLine status={deleteStatus} />
                </CardContent>
                <CardFooter className="bg-red-50/40 border-t border-red-100 p-4 flex justify-end">
                    <Button variant="destructive" onClick={removeAccount} loading={deleting}
                        disabled={confirmEmail.trim().toLowerCase() !== (account?.email || '').toLowerCase()}>
                        Delete my account
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
