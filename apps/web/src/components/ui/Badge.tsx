'use client';

import React from "react";

type BadgeTone = 'ok' | 'warn' | 'info';

type Props = React.HTMLAttributes<HTMLSpanElement> & {
    tone?: BadgeTone;
};

export default function Badge({ tone = 'info', children, style, onClick, ...props}: Props) {
    const map = {
        ok:     { bg: 'rgba(37, 209, 127, .14)', fg: '#c8ffe3'},
        warn:   { bg: 'rgba(255, 176, 32, .14)', fg: '#ffe7b8'},
        info:   { bg: 'rgba(79, 124, 255, .14)', fg: '#d4e2ff'},
    }[tone];

    const clickable = typeof onClick === 'function';

    return (
        <span
            {...props}
            onClick={onClick}
            role={clickable ? 'button' : props.role}
            tabIndex={clickable ? 0 : props.tabIndex}
            onKeyDown={(e) => {
                props.onKeyDown?.(e);

                if(!clickable) return;

                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();

                    (onClick as any)?.(e as any);
                }
            }}
            style = {{
                display: 'inline-flex',
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid var(--line)',
                background: map.bg,
                color: map.fg,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 0.2,
                cursor: clickable ? 'pointer' : 'default',
                userSelect: clickable ? 'none' : 'auto',
                ...style,
            }}>
            { children }
        </span>
    )
}