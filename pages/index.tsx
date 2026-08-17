
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function SignIn({ t }: { t?: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Signed in successfully!');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Sign In</h1>
      <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '0.75rem', cursor: 'pointer' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      {message && (
        <p style={{ marginTop: '1rem', color: message.startsWith('Error') ? 'red' : 'green' }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default SignIn;