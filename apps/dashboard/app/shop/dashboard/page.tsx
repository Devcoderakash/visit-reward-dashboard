"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import QRCode from 'qrcode';
import { Users, Activity, Gift, RefreshCw, LogOut, CheckCircle2, XCircle } from 'lucide-react';

const TABS = ['Overview', 'Verify Code', 'Customers', 'Analytics'];

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  
  // Real data state
  const [customers, setCustomers] = useState<any[]>([]);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, activeWeek: 0, redeemed: 0, repeatRate: '0%' });
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [retention, setRetention] = useState({ one: 0, twoToFour: 0, fivePlus: 0 });

  const [redemptionCode, setRedemptionCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    const fetchShopData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/shop/login');
        return;
      }

      // 1. Get shop
      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', session.user.id)
        .single();

      if (!shopData) {
        alert("Shop not found for this user");
        return;
      }
      setShop(shopData);

      // 2. Generate QR
      try {
        const url = await QRCode.toDataURL(`http://localhost:3002/scan?shop=${shopData.qr_code_id}`);
        setQrDataUrl(url);
      } catch (err) {
        console.error(err);
      }

      // 3. Fetch data
      await loadData(shopData.id);

      // 4. Realtime subscription
      const channel = supabase.channel(`shop-updates-${shopData.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_shop', filter: `shop_id=eq.${shopData.id}` }, () => {
          loadData(shopData.id); // Reload data on change
        })
        .subscribe();

      setLoading(false);

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchShopData();
  }, [router]);

  const loadData = async (shopId: string) => {
    // Customers joined with users (mock join since supabase js join syntax is tricky)
    const { data: csData } = await supabase.from('customer_shop').select('*, users:customer_id(name)').eq('shop_id', shopId);
    
    if (csData) {
      // Sort for customers tab (Most visits default)
      const sortedCustomers = [...csData].sort((a, b) => b.total_visits - a.total_visits);
      setCustomers(sortedCustomers);

      // Recent visits
      const sortedVisits = [...csData].sort((a, b) => new Date(b.last_visit_date).getTime() - new Date(a.last_visit_date).getTime()).slice(0, 10);
      setRecentVisits(sortedVisits);

      // Metrics
      const total = csData.length;
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const activeWeek = csData.filter(c => new Date(c.last_visit_date) >= oneWeekAgo).length;
      
      const { count: redeemedCount } = await supabase.from('scratch_cards').select('id', { count: 'exact' }).eq('shop_id', shopId).eq('is_redeemed', true);
      
      const repeatCount = csData.filter(c => c.total_visits > 1).length;
      const repeatRate = total > 0 ? Math.round((repeatCount / total) * 100) + '%' : '0%';
      
      setMetrics({ total, activeWeek, redeemed: redeemedCount || 0, repeatRate });

      // Retention
      const one = csData.filter(c => c.total_visits === 1).length;
      const twoToFour = csData.filter(c => c.total_visits >= 2 && c.total_visits <= 4).length;
      const fivePlus = csData.filter(c => c.total_visits >= 5).length;
      setRetention({ 
        one: total ? Math.round(one/total*100) : 0, 
        twoToFour: total ? Math.round(twoToFour/total*100) : 0, 
        fivePlus: total ? Math.round(fivePlus/total*100) : 0 
      });

      // Analytics chart
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const chartData = [0,1,2,3,4,5,6].map(i => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const visits = csData.filter(c => c.last_visit_date === dayStr).length;
        return { day: days[d.getDay()], visits };
      }).reverse();
      setAnalyticsData(chartData);
    }

    // Feedbacks
    const { data: fbData } = await supabase.from('private_feedback').select('*').eq('shop_id', shopId).order('created_at', { ascending: false });
    if (fbData) setFeedbacks(fbData);
  };

  const handleVerifyCode = async (code: string) => {
    if (code.length === 4) {
      try {
        const res = await fetch('/api/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ redemption_code: code, shop_id: shop?.id })
        });
        const data = await res.json();
        setVerificationResult(data);
      } catch (err) {
        console.error(err);
        setVerificationResult({ valid: false, reason: 'error' });
      }
    } else {
      setVerificationResult(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-bold text-primary">{shop?.name} Dashboard</h1>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/shop/login'))} className="text-gray-500 hover:text-gray-800">
          <LogOut size={20} />
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex space-x-2 border-b border-gray-200 mb-6 overflow-x-auto pb-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-t-lg font-semibold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-white border border-b-0 border-gray-200 text-primary shadow-[0_-2px_4px_rgba(0,0,0,0.02)]' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm min-h-[400px]">
          {activeTab === 'Overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-xl flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full text-primary"><Users /></div>
                  <div><p className="text-2xl font-bold">{metrics.total}</p><p className="text-sm text-gray-500">Total Customers</p></div>
                </div>
                <div className="p-4 border rounded-xl flex items-center gap-4">
                  <div className="bg-success/10 p-3 rounded-full text-success"><Activity /></div>
                  <div><p className="text-2xl font-bold">{metrics.activeWeek}</p><p className="text-sm text-gray-500">Active This Week</p></div>
                </div>
                <div className="p-4 border rounded-xl flex items-center gap-4">
                  <div className="bg-warning/10 p-3 rounded-full text-warning"><Gift /></div>
                  <div><p className="text-2xl font-bold">{metrics.redeemed}</p><p className="text-sm text-gray-500">Rewards Redeemed</p></div>
                </div>
                <div className="p-4 border rounded-xl flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full text-primary"><RefreshCw /></div>
                  <div><p className="text-2xl font-bold">{metrics.repeatRate}</p><p className="text-sm text-gray-500">Repeat Rate</p></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 border rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4">Live Visits Feed</h3>
                  <div className="space-y-4">
                    {recentVisits.map(visit => (
                      <div key={visit.id} className="flex justify-between items-center py-3 border-b border-gray-100">
                        <div>
                          <p className="font-semibold text-foreground">{visit.users?.name || 'Customer'}</p>
                          <p className="text-sm text-gray-500">Visit {visit.total_visits} {visit.total_visits % shop.visits_required === 0 && '(Reward Unlocked!)'}</p>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          {new Date(visit.last_visit_date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {recentVisits.length === 0 && <p className="text-gray-500">No recent visits.</p>}
                  </div>
                </div>
                <div className="border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <h3 className="font-bold mb-4">Shop QR Code</h3>
                  {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mb-4 border p-2 rounded-lg bg-white shadow-sm" />}
                  
                  {shop?.qr_code_id && (
                    <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-6 w-full max-w-[220px]">
                      <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Manual Code</p>
                      <p className="text-2xl font-black text-primary tracking-[0.2em]">{shop.qr_code_id}</p>
                    </div>
                  )}

                  <a href={qrDataUrl} download={`QR_${shop?.qr_code_id}.png`} className="text-primary font-bold hover:underline border-2 border-primary px-6 py-2 rounded-xl transition hover:bg-primary/5 w-full max-w-[220px]">
                    Download & Print
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Verify Code' && (
            <div className="max-w-md mx-auto py-12 text-center animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold mb-6">Verify Reward Code</h2>
              <input
                type="text"
                maxLength={4}
                value={redemptionCode}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setRedemptionCode(val);
                  handleVerifyCode(val);
                }}
                className="w-full text-center text-5xl font-mono tracking-[0.5em] border-2 border-gray-300 rounded-2xl p-6 focus:border-primary focus:outline-none uppercase shadow-sm"
                placeholder="XXXX"
              />

              {verificationResult?.valid && (
                <div className="mt-8 bg-success/10 border border-success/30 rounded-2xl p-6 text-left animate-in slide-in-from-bottom-4">
                  <p className="text-success font-bold text-lg mb-4 flex items-center gap-2"><CheckCircle2 /> Valid Code!</p>
                  <p className="text-lg mb-1 text-gray-700">Customer: <strong className="text-black">{verificationResult.customer_name}</strong></p>
                  <p className="text-lg">Reward: <strong className="text-black">{verificationResult.reward_text}</strong></p>
                  <button className="w-full mt-6 bg-success text-white font-bold py-4 rounded-xl hover:bg-opacity-90 transition shadow-lg shadow-success/20" onClick={() => { setRedemptionCode(''); setVerificationResult(null); }}>
                    Confirm Redemption
                  </button>
                </div>
              )}

              {verificationResult?.valid === false && (
                <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6 animate-in slide-in-from-bottom-4">
                  <p className="text-red-600 font-bold text-lg flex items-center justify-center gap-2"><XCircle /> Invalid or Expired Code</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Customers' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-xl">Customer List</h2>
              </div>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-600">
                      <th className="p-4 font-semibold">Name</th>
                      <th className="p-4 font-semibold">Total Visits</th>
                      <th className="p-4 font-semibold">Progress</th>
                      <th className="p-4 font-semibold">Last Visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c.id} className="border-b hover:bg-gray-50/50 transition">
                        <td className="p-4 font-medium">{c.users?.name || 'Customer'}</td>
                        <td className="p-4">{c.total_visits}</td>
                        <td className="p-4">
                          <div className="w-32 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{width: `${((c.total_visits % shop.visits_required) / shop.visits_required) * 100}%`}}></div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-500">{new Date(c.last_visit_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {customers.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No customers yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Analytics' && (
            <div className="space-y-12 animate-in fade-in duration-300">
              <div>
                <h2 className="font-bold text-xl mb-6">Last 7 Days Visits</h2>
                <div className="h-72 w-full bg-white border rounded-xl p-4 pt-6 shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                      <Bar dataKey="visits" fill="#7F77DD" radius={[6,6,0,0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-6">Retention Breakdown</h3>
                <div className="flex w-full h-10 rounded-xl overflow-hidden text-white text-sm font-bold shadow-sm">
                  {retention.one > 0 && <div className="bg-gray-400 flex items-center justify-center transition-all hover:opacity-90" style={{width: `${retention.one}%`}}>1 Visit ({retention.one}%)</div>}
                  {retention.twoToFour > 0 && <div className="bg-primary/70 flex items-center justify-center transition-all hover:opacity-90" style={{width: `${retention.twoToFour}%`}}>2-4 Visits ({retention.twoToFour}%)</div>}
                  {retention.fivePlus > 0 && <div className="bg-primary flex items-center justify-center transition-all hover:opacity-90" style={{width: `${retention.fivePlus}%`}}>5+ Visits ({retention.fivePlus}%)</div>}
                </div>
                {(retention.one === 0 && retention.twoToFour === 0 && retention.fivePlus === 0) && <p className="text-gray-500 mt-2">No retention data yet.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Private Feedback Section */}
        <div className="mt-8 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h2 className="font-bold text-xl mb-6 text-gray-800 flex items-center gap-2">Private Feedback Inbox</h2>
          <div className="space-y-4">
            {feedbacks.map(fb => (
              <div key={fb.id} className="border-l-4 border-warning bg-warning/5 p-5 rounded-r-xl transition hover:bg-warning/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex text-warning text-lg">
                    {'★'.repeat(fb.star_rating)}{'☆'.repeat(5 - fb.star_rating)}
                  </div>
                  <span className="text-sm text-gray-500 font-medium">{new Date(fb.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 italic">"{fb.feedback_text}"</p>
              </div>
            ))}
            {feedbacks.length === 0 && <p className="text-gray-500">No private feedback received.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
