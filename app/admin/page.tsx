"use client";
import React, { useState, useEffect } from 'react';

// --- ICONS (SVG) ---
const Icons = {
    Lock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
    Key: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>,
    Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
    Copy: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>,
    Refresh: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>,
    LogOut: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
    Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    Shield: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
};

export default function AdminPage() {
    const [password, setPassword] = useState("");
    const [isAuth, setIsAuth] = useState(false);
    const [keys, setKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Create Config
    const [customDays, setCustomDays] = useState(30);
    const [note, setNote] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem("admin_pass");
        if (saved) {
            setPassword(saved);
            fetchKeys(saved);
        }
    }, []);

    const fetchKeys = async (pwd: string) => {
        setRefreshing(true);
        try {
            const res = await fetch('/api/admin/keys', {
                headers: { 'x-admin-password': pwd }
            });
            const data = await res.json();
            if (data.success) {
                setKeys(data.keys);
                setIsAuth(true);
                localStorage.setItem("admin_pass", pwd);
            } else {
                setIsAuth(false);
            }
        } catch (e) {
            // error
        } finally {
            setRefreshing(false);
        }
    };

    const handleLogin = () => {
        if (!password.trim()) return;
        fetchKeys(password);
    };

    const handleCreate = async (days: number, type: 'lifetime' | 'monthly') => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
                body: JSON.stringify({ type, days, note })
            });
            const data = await res.json();
            if (data.success) {
                setNote(""); // Clear note after success
                fetchKeys(password);
            } else {
                alert("Failed: " + data.message);
            }
        } catch (e) {
            alert("Error creating key");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this key?")) return;
        try {
            await fetch(`/api/admin/keys?id=${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-password': password }
            });
            fetchKeys(password);
        } catch (e) {
            alert("Delete failed");
        }
    };

    // --- STYLES ---
    const S = {
        container: {
            minHeight: '100vh',
            background: '#09090b',
            color: '#e4e4e7',
            fontFamily: 'var(--font-geist-sans), sans-serif',
            display: 'flex',
            flexDirection: 'column' as const,
        },
        loginBox: {
            background: 'rgba(24, 24, 27, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '2.5rem',
            borderRadius: '1rem',
            maxWidth: '400px',
            width: '100%',
            margin: 'auto',
            textAlign: 'center' as const,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        },
        input: {
            width: '100%',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid #27272a',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            color: 'white',
            marginBottom: '1rem',
            outline: 'none',
            fontSize: '1rem'
        },
        btnPrimary: {
            background: 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)',
            border: 'none',
            color: 'white',
            fontWeight: 'bold',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'opacity 0.2s',
            opacity: loading ? 0.7 : 1
        },
        header: {
            background: 'rgba(9, 9, 11, 0.8)',
            borderBottom: '1px solid #27272a',
            padding: '1.5rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky' as const,
            top: 0,
            zIndex: 50,
            backdropFilter: 'blur(10px)'
        },
        logo: {
            fontSize: '1.5rem',
            fontWeight: '800',
            background: 'linear-gradient(to right, #f472b6, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
        },
        content: {
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            padding: '2rem',
            flex: 1
        },
        card: {
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem'
        },
        gridControls: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
        },
        actionBtn: (color: string) => ({
            background: '#27272a',
            border: `1px solid ${color}`,
            borderRadius: '0.75rem',
            padding: '1.25rem',
            textAlign: 'left' as const,
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative' as const,
            overflow: 'hidden'
        }),
        statsRow: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2rem'
        },
        statCard: {
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            textAlign: 'center' as const
        },
        tableWrapper: {
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '1rem',
            overflow: 'hidden'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse' as const,
            fontSize: '0.875rem'
        },
        th: {
            background: '#27272a',
            color: '#a1a1aa',
            padding: '1rem',
            textAlign: 'left' as const,
            fontWeight: '600'
        },
        td: {
            padding: '1rem',
            borderBottom: '1px solid #27272a',
            color: '#e4e4e7'
        },
        statusBadge: (isActive: boolean) => ({
            background: isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: isActive ? '#4ade80' : '#f87171',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: '600',
            display: 'inline-block'
        })
    };

    if (!isAuth) {
        return (
            <div style={{ ...S.container, justifyContent: 'center' }}>
                <div style={S.loginBox}>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ padding: '1rem', background: '#27272a', borderRadius: '50%' }}>
                            <Icons.Shield />
                        </div>
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>Admin Access</h1>
                    <p style={{ color: '#a1a1aa', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Enter secure password to manage licenses</p>
                    <input
                        type="password"
                        placeholder="Password..."
                        style={S.input}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <button style={S.btnPrimary} onClick={handleLogin}>
                        {loading ? 'Authenticating...' : 'Enter Dashboard'}
                    </button>
                </div>
            </div>
        );
    }

    const activeCount = keys.filter(k => k.status === 'active').length;

    return (
        <div style={S.container}>
            <header style={S.header}>
                <div style={S.logo}>
                    <div style={{ color: '#db2777' }}><Icons.Shield /></div>
                    LICENSE MANAGER
                </div>
                <button
                    onClick={() => { localStorage.removeItem("admin_pass"); setIsAuth(false); }}
                    style={{ background: 'transparent', border: '1px solid #3f3f46', color: '#a1a1aa', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                >
                    <Icons.LogOut /> Logout
                </button>
            </header>

            <main style={S.content}>
                {/* STATS */}
                <div style={S.statsRow}>
                    <div style={S.statCard}>
                        <div style={{ color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Keys</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{keys.length}</div>
                    </div>
                    <div style={S.statCard}>
                        <div style={{ color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Active Users</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80' }}>{activeCount}</div>
                    </div>
                    <div style={S.statCard}>
                        <div style={{ color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Expired</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f87171' }}>{keys.length - activeCount}</div>
                    </div>
                </div>

                {/* CONTROLS */}

                {/* NOTE INPUT */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Note / Customer Name (Optional)</label>
                    <input
                        type="text"
                        placeholder="e.g. John Doe, Test Key..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        style={{ ...S.input, marginBottom: 0 }}
                    />
                </div>

                <div style={S.gridControls}>
                    {/* Lifetime */}
                    <button onClick={() => handleCreate(0, 'lifetime')} style={{ ...S.actionBtn('#db2777'), background: 'linear-gradient(135deg, rgba(219, 39, 119, 0.1) 0%, rgba(0,0,0,0) 100%)' }}>
                        <div style={{ color: '#f472b6', fontWeight: 'bold', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.Key /> LIFETIME</div>
                        <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Permanent Access</div>
                    </button>
                    {/* 30 Days */}
                    <button onClick={() => handleCreate(30, 'monthly')} style={{ ...S.actionBtn('#7c3aed'), background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(0,0,0,0) 100%)' }}>
                        <div style={{ color: '#a78bfa', fontWeight: 'bold', marginBottom: '0.25rem' }}>30 DAYS</div>
                        <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Monthly Subscription</div>
                    </button>
                    {/* CUSTOM */}
                    <div style={{ ...S.actionBtn('#3f3f46'), display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                                type="number"
                                value={customDays}
                                onChange={(e) => setCustomDays(parseInt(e.target.value))}
                                style={{ background: 'black', border: '1px solid #3f3f46', color: 'white', padding: '0.25rem', borderRadius: '0.25rem', width: '60px', textAlign: 'center' }}
                            />
                            <span style={{ color: 'white', alignSelf: 'center', fontSize: '0.875rem' }}>Days</span>
                        </div>
                        <button
                            onClick={() => handleCreate(customDays, 'monthly')}
                            style={{ background: '#27272a', border: '1px solid white', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            GENERATE CUSTOM
                        </button>
                    </div>
                </div>

                {/* TABLE */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>License Database</h2>
                    <button
                        onClick={() => fetchKeys(password)}
                        style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {refreshing ? 'Refreshing...' : <><Icons.Refresh /> Refresh</>}
                    </button>
                </div>

                <div style={S.tableWrapper}>
                    <table style={S.table}>
                        <thead>
                            <tr>
                                <th style={S.th}>LICENSE KEY</th>
                                <th style={S.th}>NOTE</th>
                                <th style={S.th}>TYPE</th>
                                <th style={S.th}>STATUS</th>
                                <th style={S.th}>EXPIRES</th>
                                <th style={S.th}>DEVICES</th>
                                <th style={{ ...S.th, textAlign: 'right' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {keys.map((k) => (
                                <tr key={k.id} style={{ borderBottom: '1px solid #27272a' }}>
                                    <td style={{ ...S.td, fontFamily: 'monospace', color: '#f472b6', fontWeight: 'bold' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {k.key}
                                            <div
                                                title="Copy"
                                                style={{ cursor: 'pointer', opacity: 0.5 }}
                                                onClick={() => navigator.clipboard.writeText(k.key)}
                                            >
                                                <Icons.Copy />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ ...S.td, color: '#e4e4e7', fontSize: '0.9rem' }}>
                                        {k.note || <span style={{ color: '#52525b', fontStyle: 'italic' }}>-</span>}
                                    </td>
                                    <td style={S.td}>
                                        <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#a1a1aa' }}>
                                            {k.type === 'lifetime' ? '👑 Lifetime' : `⏳ ${Math.ceil((new Date(k.expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} Days left`}
                                        </span>
                                    </td>
                                    <td style={S.td}>
                                        <span style={S.statusBadge(k.status === 'active')}>
                                            {k.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ ...S.td, color: '#a1a1aa' }}>
                                        {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td style={S.td}>{k.device_ids?.length || 0} / 2</td>
                                    <td style={{ ...S.td, textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleDelete(k.id)}
                                            style={{ background: 'transparent', border: '1px solid #7f1d1d', color: '#f87171', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                            title="Delete"
                                        >
                                            <Icons.Trash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {keys.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#52525b' }}>
                                        No keys found. Start by generating one!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
