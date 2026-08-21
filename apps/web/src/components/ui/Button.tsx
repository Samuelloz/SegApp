'use client';
import type { ButtonHTMLAttributes, CSSProperties } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost' | 'danger';
};

export default function Button({ variant = 'primary', style, disabled, ...props }: Props) {
    const base: CSSProperties = {
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid var(--line)',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    };

    const variants: Record<string, CSSProperties> = {
        primary: {
            background: 'var(--brand)',
            color: 'white'
        },
        ghost: {
            background: 'rgba(255, 255, 255, .04)',
            color: 'var(--text)',
            borderColor: 'rgba(255, 255, 255, .12)'
        },
        danger: {
            background: 'var(--danger)',
            color: 'white'
        },
    };

    const disabledStyles: CSSProperties =
        disabled ? {
            cursor: 'not-allowed',
            opacity: 0.45,
            filter: 'saturate(0.5)',
        } : {
            cursor: 'pointer',
            opacity: 1,
        };

    return (
        <button
            {...props}
            disabled={disabled}
            style={{
                ...base,
                ...variants[variant],
                ...style,
                ...disabledStyles
            }}
        />
    )
}