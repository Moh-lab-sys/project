import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function SignIn({ t }: { t: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !user) {
      setError(authError?.message || 'Authentication failed');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('employees')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow border">
      <h2 className="text-2xl font-bold mb-6 text-center">{t.signIn}</h2>
      {error && <div className="p-3 mb-4 text-sm bg-red-50 text-red-600 rounded">{error}</div>}
      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t.email}</label>
          <input
            type="email"
            required
            className="w-full border rounded p-2.5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t.password}</label>
          <input
            type="password"
            required
            className="w-full border rounded p-2.5"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-2.5 rounded hover:bg-blue-700"
        >
          {loading ? '...' : t.signIn}
        </button>
      </form>
    </div>
  );
}