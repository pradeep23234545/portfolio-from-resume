'use client';

import { Search, User, LogOut, Palette, HelpCircle, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import MobileSidebar from './MobileSidebar';
import { NotificationBell } from './NotificationBell';

/** Fired by the Profile page after a save so the header shows the new name/photo */
export const PROFILE_UPDATED_EVENT = 'profile-updated';

export default function Header() {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    // The signed-in account, kept apart from the portfolio being edited (which may show another name)
    const [account, setAccount] = useState<{ name: string; email: string; avatarUrl: string | null }>({ name: '', email: '', avatarUrl: null });
    const [signingOut, setSigningOut] = useState(false);

    const signOut = async () => {
        setSigningOut(true);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } finally {
            window.location.href = '/login';
        }
    };
    const initials = (account.name || account.email || '?')
        .split(/[\s@]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

    const loadAccount = useCallback(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setAccount({
                        name: data.user.full_name || '',
                        email: data.user.email || '',
                        avatarUrl: data.user.avatar_url || null,
                    });
                }
            })
            .catch(err => console.error('Failed to fetch user for header:', err));
    }, []);

    useEffect(() => {
        setMounted(true);
        loadAccount();
        window.addEventListener(PROFILE_UPDATED_EVENT, loadAccount);
        return () => window.removeEventListener(PROFILE_UPDATED_EVENT, loadAccount);
    }, [loadAccount]);

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b border-border bg-white/80 px-6 backdrop-blur-md dark:bg-slate-950/80">
            <div className="flex flex-1 items-center gap-4">
                <MobileSidebar />
                <div className="relative w-full max-w-md md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search projects, skills, or templates..."
                        className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {mounted ? <NotificationBell /> : <div className="h-9 w-9" />}

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>

                {/* Profile */}
                {mounted ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-slate-200 p-0 shadow-sm hover:bg-slate-50" aria-label="Account menu">
                                {account.avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element -- avatar hosts vary
                                    <img src={account.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full text-white font-medium text-xs">
                                        {initials}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{account.name || 'Your account'}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{account.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/settings')}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Edit profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/settings#account')}>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    <span>Account & security</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/customize')}>
                                    <Palette className="mr-2 h-4 w-4 text-amber-500" />
                                    <span>Customize portfolio</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/help')}>
                                <HelpCircle className="mr-2 h-4 w-4" />
                                <span>Help & Support</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" disabled={signingOut} onSelect={signOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>{signingOut ? 'Signing out…' : 'Log out / switch account'}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="h-9 w-9 rounded-full bg-slate-200 animate-pulse" />
                )}
            </div>
        </header>
    );
}
