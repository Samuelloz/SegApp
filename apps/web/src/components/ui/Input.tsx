'use client';
import type { InputHTMLAttributes } from "react";

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            style= {{
                padding: '11px 12px',
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'rgba(0,0,0,.25',
                color: 'var(--text)',
                outline: 'none',
                width: '100%',
                ...props.style,
            }}
            />
        );
};