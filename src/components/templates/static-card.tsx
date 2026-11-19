import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Plain versions of the dashboard Card pieces (same styling, no animation library),
 * so portfolio layouts also render on the server for the website export.
 */
type DivProps = HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: DivProps) => (
    <div className={cn('rounded-lg border border-slate-200 bg-white shadow-md', className)} {...props} />
);
export const CardHeader = ({ className, ...props }: DivProps) => (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
);
export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn('font-bold text-xl leading-none tracking-tight', className)} {...props} />
);
export const CardContent = ({ className, ...props }: DivProps) => (
    <div className={cn('p-6 pt-0', className)} {...props} />
);
