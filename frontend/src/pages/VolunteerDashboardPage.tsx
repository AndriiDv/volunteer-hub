import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Upload,
  CheckCircle2,
  Clock,
  FileCheck,
  Save,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Fundraiser } from '../types/api';

export const VolunteerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [myJars, setMyJars] = useState<Fundraiser[]>([]);
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadMyFundraisers = async () => {
    try {
      setLoading(true);
      const needs = await api.getNeeds();
      const allJars: Fundraiser[] = [];
      needs.forEach((n) => {
        (n.fundraisers || []).forEach((f) => {
          allJars.push({
            ...f,
            need_title: f.need_title || n.title,
            unit_name: f.unit_name || n.unit_name,
          });
        });
      });

      const mine = user?.id
        ? allJars.filter((j) => j.volunteer_id === user.id || user.role === 'admin')
        : allJars;

      setMyJars(mine);
      const initialAmounts: Record<number, string> = {};
      mine.forEach((j) => {
        initialAmounts[j.id] = String(j.current_amount);
      });
      setAmounts(initialAmounts);
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Помилка завантаження банок',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyFundraisers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleUpdateAmount = async (jarId: number) => {
    const val = Number(amounts[jarId]);
    if (Number.isNaN(val) || val < 0) return;

    try {
      setSavingId(jarId);
      setMessage(null);
      const updated = await api.updateFundraiser(jarId, { current_amount: val });
      setMyJars((prev) =>
        prev.map((j) => (j.id === jarId ? { ...j, ...updated } : j))
      );
      setMessage({ type: 'ok', text: 'Зібрану суму оновлено!' });
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Помилка оновлення суми',
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleFileUpload = async (
    jarId: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingId(jarId);
      setMessage(null);
      const updated = await api.uploadFundraiserProof(jarId, file);
      setMyJars((prev) =>
        prev.map((j) =>
          j.id === jarId
            ? { ...j, ...updated, status: updated.status || 'proof_uploaded' }
            : j
        )
      );
      setMessage({
        type: 'ok',
        text: 'Квитанцію завантажено в S3! Очікуємо підтвердження військового.',
      });
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Помилка завантаження чеку',
      });
    } finally {
      setUploadingId(null);
    }
  };

  const totalCollected = myJars.reduce((acc, j) => acc + j.current_amount, 0);
  const verifiedCount = myJars.filter((j) => j.status === 'verified').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Кабінет волонтера
          </h1>
          <p className="text-sm text-slate-500">
            Керуй своїми дружніми банками, оновлюй прогрес та завантажуй чеки
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Обрати нову потребу</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Усього зібрано</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {totalCollected.toLocaleString('uk-UA')} грн
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Активних банок</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {myJars.length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">
            Підтверджено підрозділами
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {verifiedCount}
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            message.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500">
          Завантаження твоїх банок...
        </div>
      ) : myJars.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-600 font-medium mb-3">
            У тебе ще немає відкритих дружніх банок.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:underline"
          >
            Перейти до вітрини потреб →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myJars.map((jar) => {
            const pct =
              jar.target_amount > 0
                ? Math.min(
                    100,
                    Math.round((jar.current_amount / jar.target_amount) * 100)
                  )
                : 0;

            return (
              <div
                key={jar.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-emerald-700">
                      {jar.unit_name}
                    </div>
                    <Link
                      to={`/needs/${jar.need_id}`}
                      className="text-lg font-bold text-slate-900 hover:text-emerald-700"
                    >
                      {jar.need_title || `Збір #${jar.need_id}`}
                    </Link>
                    {jar.title && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {jar.title}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {jar.status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Підтверджено військовим
                      </span>
                    ) : jar.status === 'proof_uploaded' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                        <FileCheck className="w-3.5 h-3.5" />
                        Чек на перевірці
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        Активний збір
                      </span>
                    )}

                    {jar.monobank_url && (
                      <a
                        href={jar.monobank_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        title="Відкрити Monobank"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>
                      Зібрано {jar.current_amount.toLocaleString('uk-UA')} із{' '}
                      {jar.target_amount.toLocaleString('uk-UA')} грн
                    </span>
                    <span className="text-emerald-700 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Оновити зібрану суму (грн)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={amounts[jar.id] ?? ''}
                        onChange={(e) =>
                          setAmounts((prev) => ({
                            ...prev,
                            [jar.id]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      onClick={() => handleUpdateAmount(jar.id)}
                      disabled={savingId === jar.id}
                      className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingId === jar.id ? '...' : 'Зберегти'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Квитанція переказу на частину / постачальника
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/60 text-emerald-800 text-sm font-medium hover:bg-emerald-50 transition">
                        <Upload className="w-4 h-4" />
                        <span>
                          {uploadingId === jar.id
                            ? 'Завантаження в S3...'
                            : jar.proof_url
                            ? 'Замінити скріншот чеку'
                            : 'Завантажити скріншот чеку'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingId === jar.id}
                          onChange={(e) => handleFileUpload(jar.id, e)}
                        />
                      </label>

                      {jar.proof_url && (
                        <a
                          href={jar.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Чек ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
