'use client';

import { useState } from 'react';
import { useCreateContractMutation, useGetContractsQuery } from '@/store/api';

export default function Home() {
  const { data, isLoading, error } = useGetContractsQuery();
  const [createContract, { isLoading: isCreating }] = useCreateContractMutation();
  const [name, setName] = useState('');

  return (
    <main style={{ padding: 20}}>
      <h1>Contracts</h1>
      
      <div style={{ display: 'flex', gap: 8, marginTop: 12}}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
        <button
          disabled={isCreating}
          onClick={async () => {
            if (!name.trim()) return;
            await createContract({ name: name.trim() }).unwrap();
            setName('');
          }}
        >
          {isCreating ? 'Guardando...' : 'Agregar'}
        </button>
      </div>

      {isLoading && <p>Cargando...</p>}
      {error && <p>Error al cargar los contratos.</p>}

      <ul style={{ marginTop: 16 }}>
        {(data ?? []).map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>
    </main>
  )
}