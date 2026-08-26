import { useState } from 'react';

/**
 * Sample island. Exists to prove the MDX -> React -> hydration path works;
 * delete it once there's a real one.
 */
export default function Demo() {
  const [n, setN] = useState(0);

  return (
    <div
      style={{
        border: '1px solid currentColor',
        borderRadius: '6px',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        opacity: 0.85,
      }}
    >
      <button
        onClick={() => setN((v) => v + 1)}
        style={{
          font: 'inherit',
          padding: '0.25rem 0.75rem',
          borderRadius: '4px',
          border: '1px solid currentColor',
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
        }}
      >
        squid
      </button>
      <span>{'🦑'.repeat(n) || 'no squid yet'}</span>
    </div>
  );
}
