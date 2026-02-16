import type { ReactNode } from "react";

export default function Card({ children }: { children: ReactNode}) {
    return (
        <article
            style={{ 
                border: '1px solid var(--line)',
                background: 'var(--panel2)',
                borderRadius: 'var(--r16)',
                padding: 14
            }}>
                {children}
        </article>
    )
}