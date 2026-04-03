'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

function PasswordGate({ onAuth }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (pw === 'P@cM@n123') {
      onAuth();
    } else {
      setError(true);
    }
  }

  return (
    <div className="ij-admin-password">
      <h1>Admin</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false); }}
          placeholder="Password"
          autoFocus
        />
        <button type="submit">Enter</button>
      </form>
      {error && <p className="ij-admin-error">Wrong password</p>}
    </div>
  );
}

function InvestorTable({ data }) {
  if (!data.length) return <p className="ij-admin-empty">No investor leads yet.</p>;

  return (
    <div className="ij-admin-table-wrap">
      <table className="ij-admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Level</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td>{row.name}</td>
              <td><a href={`mailto:${row.email}`}>{row.email}</a></td>
              <td>{row.phone || '—'}</td>
              <td><span className="ij-admin-badge">{row.investment_level || '—'}</span></td>
              <td className="ij-admin-date">{new Date(row.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WaitlistTable({ data }) {
  if (!data.length) return <p className="ij-admin-empty">No waitlist signups yet.</p>;

  return (
    <div className="ij-admin-table-wrap">
      <table className="ij-admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Source</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td><a href={`mailto:${row.email}`}>{row.email}</a></td>
              <td><span className="ij-admin-badge">{row.source || 'general'}</span></td>
              <td className="ij-admin-date">{new Date(row.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('investors');
  const [investors, setInvestors] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authed) return;
    async function load() {
      const [inv, wl] = await Promise.all([
        supabase.from('deck_waitlist').select('*').order('created_at', { ascending: false }),
        supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
      ]);
      setInvestors(inv.data || []);
      setWaitlist(wl.data || []);
      setLoading(false);
    }
    load();
  }, [authed]);

  if (!authed) {
    return (
      <div className="ij-admin-page">
        <PasswordGate onAuth={() => setAuthed(true)} />
      </div>
    );
  }

  return (
    <div className="ij-admin-page">
      <div className="ij-admin-header">
        <div>
          <h1>itsthejob — Leads</h1>
          <a href="/" className="ij-admin-back">&larr; Back to site</a>
        </div>
        <div className="ij-admin-counts">
          <span className="ij-admin-count">{investors.length} investors</span>
          <span className="ij-admin-count">{waitlist.length} waitlist</span>
        </div>
      </div>

      <div className="ij-admin-tabs">
        <button className={`ij-admin-tab ${tab === 'investors' ? 'active' : ''}`} onClick={() => setTab('investors')}>
          Investors ({investors.length})
        </button>
        <button className={`ij-admin-tab ${tab === 'waitlist' ? 'active' : ''}`} onClick={() => setTab('waitlist')}>
          Waitlist ({waitlist.length})
        </button>
      </div>

      {loading ? (
        <p className="ij-admin-empty">Loading...</p>
      ) : (
        <>
          {tab === 'investors' && <InvestorTable data={investors} />}
          {tab === 'waitlist' && <WaitlistTable data={waitlist} />}
        </>
      )}
    </div>
  );
}
