import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';

export default function EmployeeDashboard({ t }: { t: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'leave' | 'vacation' | 'history'>('leave');
  const [vacationType, setVacationType] = useState<'sick' | 'annual' | 'death'>('annual');
  const [file, setFile] = useState<File | null>(null);
  const [warning, setWarning] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }
    const { data } = await supabase.from('employees').select('*').eq('id', user.id).single();
    setProfile(data);
  };

  const handleLeaveSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      employee_id: profile.id,
      date: formData.get('date'),
      time_from: formData.get('time_from'),
      time_to: formData.get('time_to'),
      total_hours: parseFloat(formData.get('total_hours') as string),
      notes: formData.get('notes'),
    };

    const { data: request, error } = await supabase.from('leave_requests').insert(payload).select().single();
    
    if (!error && request) {
      await supabase.from('notifications').insert({
        request_type: 'leave',
        request_id: request.id,
        employee_name: profile.name,
        details: `Hourly Leave: ${payload.total_hours} hrs on ${payload.date}`,
      });
      alert('Leave Request Submitted');
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  const handleVacationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setWarning('');
    const formData = new FormData(e.currentTarget);
    
    let reportUrl = null;
    let isDeducted = false;

    if (vacationType === 'sick') {
      if (file) {
        const filePath = `${profile.id}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('medical-reports')
          .upload(filePath, file);

        if (!uploadErr && uploadData) {
          reportUrl = uploadData.path;
        }
      } else {
        isDeducted = true;
        setWarning(t.missingReportWarning);
      }
    }

    const payload = {
      employee_id: profile.id,
      type: vacationType,
      required_date_from: formData.get('date_from'),
      required_date_to: formData.get('date_to'),
      date: new Date().toISOString().split('T')[0],
      notes: formData.get('notes'),
      medical_report_url: reportUrl,
      deducted_no_report: isDeducted,
    };

    const { data: request, error } = await supabase.from('vacation_requests').insert(payload).select().single();
    if (!error && request) {
      await supabase.from('notifications').insert({
        request_type: 'vacation',
        request_id: request.id,
        employee_name: profile.name,
        details: `${vacationType.toUpperCase()} Vacation: From ${payload.required_date_from} to ${payload.required_date_to}. ${isDeducted ? '[Deducted - No Report]' : ''}`,
      });
      alert('Vacation Request Submitted');
      (e.target as HTMLFormElement).reset();
      setFile(null);
    }
    setLoading(false);
  };

  const loadHistory = async () => {
    setActiveTab('history');
    const { data: leaves } = await supabase.from('leave_requests').select('*').eq('employee_id', profile.id);
    const { data: vacations } = await supabase.from('vacation_requests').select('*').eq('employee_id', profile.id);
    
    const combined = [
      ...(leaves || []).map(l => ({ ...l, reqType: 'Hourly Leave' })),
      ...(vacations || []).map(v => ({ ...v, reqType: v.type.toUpperCase() })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setHistory(combined);
  };

  if (!profile) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded border flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{profile.name}</h1>
          <p className="text-sm text-gray-500">#{profile.employee_number} | {profile.job_position}</p>
        </div>
        <button onClick={loadHistory} className="px-4 py-2 border rounded hover:bg-gray-50 text-sm font-medium">
          {t.history}
        </button>
      </div>

      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('leave')}
          className={`py-3 px-6 border-b-2 font-medium text-sm ${activeTab === 'leave' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
        >
          {t.leaveTracker}
        </button>
        <button
          onClick={() => setActiveTab('vacation')}
          className={`py-3 px-6 border-b-2 font-medium text-sm ${activeTab === 'vacation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
        >
          {t.vacationTracker}
        </button>
      </div>

      {activeTab === 'leave' && (
        <form onSubmit={handleLeaveSubmit} className="bg-white p-6 rounded border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" name="date" required className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Hours</label>
              <input type="number" step="0.5" name="total_hours" required className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time From</label>
              <input type="time" name="time_from" required className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time To</label>
              <input type="time" name="time_to" required className="w-full border rounded p-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea name="notes" className="w-full border rounded p-2" rows={3}></textarea>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium py-2 rounded">
            {loading ? 'Submitting...' : t.submit}
          </button>
        </form>
      )}

      {activeTab === 'vacation' && (
        <form onSubmit={handleVacationSubmit} className="bg-white p-6 rounded border space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vacation Type</label>
            <select value={vacationType} onChange={(e: any) => setVacationType(e.target.value)} className="w-full border rounded p-2">
              <option value="annual">{t.annual}</option>
              <option value="sick">{t.sick}</option>
              <option value="death">{t.death}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Required Date From</label>
              <input type="date" name="date_from" required className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Required Date To</label>
              <input type="date" name="date_to" required className="w-full border rounded p-2" />
            </div>
          </div>

          {vacationType === 'sick' && (
            <div>
              <label className="block text-sm font-medium mb-1">{t.medicalReport}</label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full border rounded p-2" />
            </div>
          )}

          {warning && <div className="p-3 text-sm bg-amber-50 text-amber-800 border rounded">{warning}</div>}

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea name="notes" className="w-full border rounded p-2" rows={3}></textarea>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium py-2 rounded">
            {loading ? 'Submitting...' : t.submit}
          </button>
        </form>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded border divide-y">
          {history.map((item) => (
            <div key={item.id} className="p-4 flex justify-between items-center">
              <div>
                <span className="font-bold text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{item.reqType}</span>
                <p className="text-sm mt-1">{item.notes || 'No notes'}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              {item.deducted_no_report && (
                <span className="text-xs text-red-600 bg-red-50 border px-2 py-1 rounded font-medium">
                  {t.deductedFlag}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}