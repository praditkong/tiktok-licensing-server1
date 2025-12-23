"use client";

import { useState } from 'react';

export default function AdminPage() {
    const [secret, setSecret] = useState('');
    const [type, setType] = useState('lifetime');
    const [count, setCount] = useState(1);
    const [keys, setKeys] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setKeys([]);

        try {
            const res = await fetch('/api/admin/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${secret}`
                },
                body: JSON.stringify({ type, count })
            });

            const data = await res.json();

            if (data.success) {
                setKeys(data.keys);
            } else {
                setError(data.message || 'Unknown Error');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(keys.join('\n'));
        alert('Copied to clipboard!');
    };

    return (
        <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h1 style={{ textAlign: 'center' }}>🔐 License Admin</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Admin Secret:</label>
                    <input
                        type="password"
                        value={secret}
                        onChange={e => setSecret(e.target.value)}
                        style={{ width: '100%', padding: '8px', fontSize: '16px' }}
                        placeholder="Enter ADMIN_SECRET from Vercel"
                    />
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type:</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
                        >
                            <option value="lifetime">Lifetime</option>
                            <option value="monthly">Monthly (30 Days)</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quantity:</label>
                        <input
                            type="number"
                            value={count}
                            onChange={e => setCount(parseInt(e.target.value))}
                            min={1}
                            max={100}
                            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
                        />
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading || !secret}
                    style={{
                        padding: '12px',
                        fontSize: '16px',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Generating...' : 'Generate Keys 🚀'}
                </button>

                {error && (
                    <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffecec', borderRadius: '5px' }}>
                        Error: {error}
                    </div>
                )} //
            </div>

            {keys.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <strong style={{ fontSize: '18px' }}>Generated Keys ({keys.length}):</strong>
                        <button onClick={copyToClipboard} style={{ padding: '5px 10px', cursor: 'pointer' }}>Copy All</button>
                    </div>
                    <textarea
                        readOnly
                        value={keys.join('\n')}
                        style={{ width: '100%', height: '200px', fontFamily: 'monospace', padding: '10px' }}
                    />
                </div>
            )}
        </div>
    );
}
