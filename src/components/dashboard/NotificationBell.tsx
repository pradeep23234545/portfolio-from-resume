'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, X, LogIn, UserCog, ShieldCheck, Database, Sparkles, Globe, FilePen, CheckCheck, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    listNotifications, markNotificationRead, markAllNotificationsRead, removeNotification, clearNotifications,
} from '@/actions/notifications';
import type { AppNotification, NotificationKind } from '@/lib/notifications';

/** Pages call this after an action that may have added a notification */
export const NOTIFICATIONS_CHANGED_EVENT = 'notifications-changed';
export const refreshNotifications = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));

const KIND_ICON: Record<NotificationKind, { icon: typeof Bell; className: string }> = {
    login: { icon: LogIn, className: 'bg-sky-100 text-sky-600' },
    account: { icon: UserCog, className: 'bg-indigo-100 text-indigo-600' },
    profile: { icon: UserCog, className: 'bg-indigo-100 text-indigo-600' },
    security: { icon: ShieldCheck, className: 'bg-rose-100 text-rose-600' },
    source: { icon: Database, className: 'bg-amber-100 text-amber-600' },
    generate: { icon: Sparkles, className: 'bg-purple-100 text-purple-600' },
    publish: { icon: Globe, className: 'bg-emerald-100 text-emerald-600' },
    content: { icon: FilePen, className: 'bg-slate-100 text-slate-600' },
};

function timeAgo(iso: string) {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
    return new Date(iso).toLocaleDateString();
}

/** Bell with an unread count; the list lives inside the dropdown (no pop-up toasts). */
export function NotificationBell() {
    const pathname = usePathname();
    const [items, setItems] = useState<AppNotification[]>([]);
    const [openId, setOpenId] = useState<string | null>(null);

    const refresh = useCallback(() => {
        listNotifications().then(setItems).catch(() => {});
    }, []);

    // Load on start, after each page change or action, when the tab regains focus, and every 20 s
    useEffect(() => {
        refresh();
        const timer = setInterval(refresh, 20_000);
        const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
        window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(timer);
            window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [refresh, pathname]);

    const unread = items.filter(n => !n.read).length;

    const open = (n: AppNotification) => {
        setOpenId(id => (id === n.id ? null : n.id));
        if (!n.read) {
            setItems(list => list.map(x => (x.id === n.id ? { ...x, read: true } : x)));
            markNotificationRead(n.id).then(setItems).catch(() => {});
        }
    };
    const remove = (id: string) => {
        setItems(list => list.filter(x => x.id !== id));
        removeNotification(id).then(setItems).catch(() => {});
    };
    const readAll = () => {
        setItems(list => list.map(x => ({ ...x, read: true })));
        markAllNotificationsRead().then(setItems).catch(() => {});
    };
    const clearAll = () => {
        setItems([]);
        clearNotifications().then(setItems).catch(() => {});
    };

    return (
        <DropdownMenu onOpenChange={o => { if (o) refresh(); else setOpenId(null); }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                    aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
                    <Bell className="h-5 w-5" />
                    {unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[360px] max-w-[calc(100vw-2rem)] p-0">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Notifications</p>
                        <p className="text-xs text-slate-500">{unread ? `${unread} unread` : 'All caught up'}</p>
                    </div>
                    <div className="flex gap-1">
                        <button type="button" onClick={readAll} disabled={!unread} title="Mark all as read"
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-30">
                            <CheckCheck className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={clearAll} disabled={!items.length} title="Clear all"
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 disabled:opacity-30">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm text-slate-500">
                            <Bell className="mx-auto mb-2 h-6 w-6 opacity-30" />
                            No notifications yet.
                        </div>
                    ) : items.map(n => {
                        const { icon: Icon, className } = KIND_ICON[n.kind] || KIND_ICON.content;
                        const expanded = openId === n.id;
                        return (
                            <div key={n.id} className={`group relative border-b border-slate-100 last:border-0 ${n.read ? '' : 'bg-indigo-50/50'}`}>
                                <button type="button" onClick={() => open(n)} aria-expanded={expanded}
                                    className="flex w-full items-start gap-3 px-4 py-3 pr-10 text-left hover:bg-slate-50">
                                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${className}`}>
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2">
                                            <span className={`truncate text-sm ${n.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>{n.title}</span>
                                            {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label="Unread" />}
                                        </span>
                                        <span className={`mt-0.5 block text-xs text-slate-500 ${expanded ? '' : 'line-clamp-1'}`}>{n.body}</span>
                                        <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                                    </span>
                                </button>
                                {expanded && n.href && (
                                    <Link href={n.href} className="ml-[60px] mb-3 -mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
                                        Open <ArrowRight className="h-3 w-3" />
                                    </Link>
                                )}
                                <button type="button" onClick={() => remove(n.id)} title="Remove notification" aria-label={`Remove "${n.title}"`}
                                    className="absolute right-2 top-3 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
