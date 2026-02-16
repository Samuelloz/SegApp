'use client';
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost' | 'danger';
};

export default function Button({ variant = 'primary', style, ...props }: Props) {
    const base: React.CSSProperties = {
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid var(--line)',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    };

    const variants: Record<string, React.CSSProperties> = {
        primary: { background: 'var(--brand)', color: 'white'},
        ghost: { background: 'rgba(255, 255, 255, .04)', color: 'var(--text)', borderColor: 'rgba(255, 255, 255, .12)'},
        danger: { background: 'var(--danger)', color: 'white'},
    }

    return <button {...props} style={{ ...base, ...variants[variant], ...style}}/>
}