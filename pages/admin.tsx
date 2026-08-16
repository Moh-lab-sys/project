import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';

export default function AdminDashboard({ t }: { t: any }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [empNum, setEmpNum] = useState('');
  const [position, setPosition] = useState('Staff');
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/');

    const { data: profile } = await supabase.from('employees').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return router.push('/dashboard');

    fetchNotifications();
    fetchAllSubmissions();
  };

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    setNotifications(data || []);
  };

  const fetchAllSubmissions = async () => {
    const { data: leaves } = await supabase.from('leave_requests').select('*, employees(name, employee_number)');
    const { data: vacations } = await supabase.from('vacation_requests').select('*, employees(name, employee_number)');

    const combined = [
      ...(leaves || []).map(l => ({ ...l, typeCategory: 'Hourly Leave' })),
      ...(vacations || []).map(v => ({ ...v, typeCategory: `Vacation (${v.type})` })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setAllSubmissions(combined);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr || !authData.user) return alert(authErr?.message || 'Error creating user');

    const { error: dbErr } = await supabase.from('employees').insert({
      id: authData.user.id,
      name,
      employee_number: empNum,
      job_position: position,
      role: 'employee',
    });

    if (!dbErr) {
      alert('Employee account created!');
      setShowUserModal(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.adminDashboard}</h1>
        <button onClick={() => setShowUserModal(true)} className="bg-green-600 text-white px-4 py-2 rounded text-sm">
          + {t.createUser}
        </button>
      </div>

      <div className="bg-white p-4 rounded border">
        <h2 className="font-bold text-lg mb-3 flex items-center space-x-2">
          <span>{t.notifications}</span>
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{notifications.length}</span>
        </h2>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {notifications.map((n) => (
            <div key={n.id} className="p-3 bg-gray-50 border rounded text-sm">
              <span className="font-semibold">{n.employee_name}</span>: {n.details}
              <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded border">
        <div className="p-4 border-b font-bold">All Submissions</div>
        <div className="divide-y">
          {allSubmissions.map((sub) => (
            <div key={sub.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{sub.employees?.name} (#{sub.employees?.employee_number})</p>
                <p className="text-xs text-gray-500">{sub.typeCategory} | {sub.date || `${sub.required_date_from} to ${sub.required_date_to}`}</p>
              </div>
              <div>
                {sub.deducted_no_report && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Deducted (No Report)</span>
                )}
                {sub.medical_report_url && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/medical-reports/${sub.medical_report_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-xs text-blue-600 underline"
                  >
                    View Report
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded p-6 max-w-md w-full space-y-3">
            <h3 className="font-bold text-lg">{t.createUser}</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input type="text" placeholder="Full Name" required className="w-full border p-2 rounded" onChange={e => setName(e.target.value)} />
              <input type="text" placeholder="Employee #" required className="w-full border p-2 rounded" onChange={e => setEmpNum(e.target.value)} />
              <select className="w-full border p-2 rounded" value={position} onChange={e => setPosition(e.target.value)}>
                <option value="Manager">Manager</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Staff">Staff</option>
                <option value="Technician">Technician</option>
              </select>
              <input type="email" placeholder="Email" required className="w-full border p-2 rounded" onChange={e => setEmail(e.target.value)} />
              <input type="password" placeholder="Password" required className="w-full border p-2 rounded" onChange={e => setPassword(e.target.value)} />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}