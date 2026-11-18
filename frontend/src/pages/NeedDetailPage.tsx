import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Clock,
  Plus,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  CATEGORY_LABELS,
  Fundraiser,
  Need,
  URGENCY_CONFIG,
} from '../types/api';
import { CreateFundraiserModal } from '../components/CreateFundraiserModal';

export const NeedDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [need, setNeed] = useState<Need | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadNeed = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getNeedById(id);
      setNeed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити потребу');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleOpenJarClick = () => {
    if (!user) {
      navigate('/auth', { state: { from: { pathname: `/needs/${id}` } } });
      return;
    }
    setIsModalOpen(true);
  };

  const handleFundraiserCreated = (created: Fundraiser) => {
    setNeed((prev) =>
      prev
        ? {
            ...prev,
            fundraisers: [created, ...(prev.fundraisers || [])],
          }
        : prev
    );
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Завантаження деталей збору...
      </div>
    );
  }

  if (error || !need) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <span>{error || 'Потребу не знайдено'}</span>
      </div>
    );
  }

  const percentage =
    need.target_amount > 0
      ? Math.min(100, Math.round((need.current_amount / need.target_amount) * 100))
      : 0;
  const urgency = URGENCY_CONFIG[need.urgency] || URGENCY_CONFIG.medium;
  const fundraisers = need.fundraisers || [];

  return (
    <div className="space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Назад до вітрини потреб</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {need.unit_name} (Верифіковано)
            </span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {CATEGORY_LABELS[need.category] || need.category}
            </span>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${urgency.badgeClass}`}
          >
            {urgency.label}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
          {need.title}
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-6">
          {need.description}
        </p>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 mb-6">
          <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
            <div>
              <div className="text-xs text-slate-500 font-medium">
                Загальний прогрес по дружніх банках
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {need.current_amount.toLocaleString('uk-UA')} грн{' '}
                <span className="text-sm font-normal text-slate-500">
                  з {need.target_amount.toLocaleString('uk-UA')} грн
                </span>
              </div>
            </div>
            <div className="text-xl font-extrabold text-emerald-600">
              {percentage}%
            </div>
          </div>

          <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-500 max-w-md">
            Хочеш допомогти закрити цей запит? Забронюй частину суми та відкрий
            власну дружню банку в Monobank.
          </p>
          <button
            onClick={handleOpenJarClick}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Відкрити дружню банку</span>
          </button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Дружні банки під цей запит ({fundraisers.length})
          </h2>
        </div>

        {fundraisers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-600 font-medium mb-2">
              Під цей запит ще не відкрито жодної дружньої банки.
            </p>
            <button
              onClick={handleOpenJarClick}
              className="text-sm font-semibold text-emerald-600 hover:underline"
            >
              Стати першим волонтером цього збору →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fundraisers.map((jar) => {
              const jarPct =
                jar.target_amount > 0
                  ? Math.min(
                      100,
                      Math.round((jar.current_amount / jar.target_amount) * 100)
                    )
                  : 0;

              return (
                <div
                  key={jar.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {jar.volunteer_name}
                        </div>
                        {jar.title && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {jar.title}
                          </div>
                        )}
                      </div>

                      {jar.status === 'verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Підтверджено ЗСУ
                        </span>
                      ) : jar.status === 'proof_uploaded' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                          <FileCheck className="w-3.5 h-3.5" />
                          Чек на перевірці
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          Триває збір
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">
                          {jar.current_amount.toLocaleString('uk-UA')} /{' '}
                          {jar.target_amount.toLocaleString('uk-UA')} грн
                        </span>
                        <span className="font-bold text-slate-800">{jarPct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${jarPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    {jar.monobank_url && (
                      <a
                        href={jar.monobank_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                      >
                        <span>Задонатити на Банку</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {jar.proof_url && (
                      <a
                        href={jar.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
                      >
                        Переглянути чек
                      </a>
                    )}

                    {/* Слот для Людини 3: кнопка генератора Stories */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <CreateFundraiserModal
        need={need}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleFundraiserCreated}
      />
    </div>
  );
};
