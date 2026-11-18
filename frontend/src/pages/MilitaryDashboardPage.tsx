import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  CheckCircle2,
  FileCheck,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  CATEGORY_LABELS,
  Fundraiser,
  Need,
  NeedCategory,
  NeedUrgency,
} from '../types/api';

export const MilitaryDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<NeedCategory>('drones');
  const [urgency, setUrgency] = useState<NeedUrgency>('critical');
  const [targetAmount, setTargetAmount] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getNeeds();
      setNeeds(data);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Помилка завантаження даних',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const amount = Number(targetAmount);
    if (!amount || amount < 1000) {
      setFeedback({ type: 'err', text: 'Вкажи коректну цільову суму (від 1000 грн)' });
      return;
    }

    try {
      setCreating(true);
      const created = await api.createNeed({
        title: title.trim(),
        description: description.trim(),
        category,
        urgency,
        target_amount: amount,
      });
      setNeeds((prev) => [created, ...prev]);
      setTitle('');
      setDescription('');
      setTargetAmount('');
      setFeedback({
        type: 'ok',
        text: 'Нову потребу опубліковано на вітрині Volunteer Hub!',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Не вдалося створити потребу',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleVerifyJar = async (jarId: number) => {
    try {
      setVerifyingId(jarId);
      setFeedback(null);
      await api.verifyFundraiser(jarId);
      setNeeds((prev) =>
        prev.map((n) => ({
          ...n,
          fundraisers: (n.fundraisers || []).map((f) =>
            f.id === jarId ? { ...f, status: 'verified' } : f
          ),
        }))
      );
      setFeedback({
        type: 'ok',
        text: 'Отримання коштів підтверджено! Волонтеру нараховано бали в рейтинг.',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Помилка підтвердження чеку',
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const pendingJars: Fundraiser[] = [];
  needs.forEach((n) => {
    (n.fundraisers || []).forEach((f) => {
      if (f.proof_url && f.status !== 'verified') {
        pendingJars.push({
          ...f,
          need_title: f.need_title || n.title,
          unit_name: f.unit_name || n.unit_name,
        });
      }
    });
  });

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{user?.unit_name || 'Кабінет військового підрозділу'}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Керування потребами та підтвердження чеків
        </h1>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>Опублікувати нову потребу</span>
            </h2>

            <form onSubmit={handleCreateNeed} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Назва запиту *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Напр.: 3x DJI Mavic 3 Pro для розвідки"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Категорія *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NeedCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {(Object.keys(CATEGORY_LABELS) as NeedCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Терміновість *
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as NeedUrgency)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="critical">Критично</option>
                    <option value="medium">Терміново</option>
                    <option value="low">Планово</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Загальна сума збору (грн) *
                </label>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="240000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Детальний опис потреби *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Для якого напрямку, комплектація, чому це критично зараз..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {creating ? 'Публікація...' : 'Опублікувати на вітрині'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <span>Банки, що чекають підтвердження ({pendingJars.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Перевір скріншот квитанції переказу та підтвердь отримання в 1 клік
            </p>

            {loading ? (
              <div className="py-10 text-center text-slate-500 text-sm">
                Завантаження...
              </div>
            ) : pendingJars.length === 0 ? (
              <div className="py-10 text-center bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-500">
                Немає неперевірених чеків. Усі завантажені квитанції опрацьовано!
              </div>
            ) : (
              <div className="space-y-4">
                {pendingJars.map((jar) => (
                  <div
                    key={jar.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-500">
                        Потреба: {jar.need_title}
                      </div>
                      <div className="text-base font-bold text-slate-900">
                        Волонтер: {jar.volunteer_name}
                      </div>
                      <div className="text-sm text-emerald-700 font-semibold">
                        Заявлена сума: {jar.current_amount.toLocaleString('uk-UA')} грн
                      </div>
                      {jar.proof_url && (
                        <a
                          href={jar.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
                        >
                          <span>Відкрити скріншот квитанції (S3)</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => handleVerifyJar(jar.id)}
                      disabled={verifyingId === jar.id}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {verifyingId === jar.id
                          ? 'Підтвердження...'
                          : 'Підтвердити отримання'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
