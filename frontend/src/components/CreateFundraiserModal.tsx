import React, { useState } from 'react';
import { X, ExternalLink, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Fundraiser, Need } from '../types/api';

interface CreateFundraiserModalProps {
  need: Need;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (fundraiser: Fundraiser) => void;
}

export const CreateFundraiserModal: React.FC<CreateFundraiserModalProps> = ({
  need,
  isOpen,
  onClose,
  onCreated,
}) => {
  const remaining = Math.max(1000, need.target_amount - need.current_amount);
  const defaultSlot = Math.min(15000, remaining);

  const [monobankUrl, setMonobankUrl] = useState('');
  const [targetAmount, setTargetAmount] = useState<string>(String(defaultSlot));
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!monobankUrl.includes('monobank.ua')) {
      setError('Встав коректне посилання на Банку Monobank (send.monobank.ua/jar/...)');
      return;
    }

    const amountNum = Number(targetAmount);
    if (!amountNum || amountNum < 500) {
      setError('Мінімальна сума слоту — 500 грн');
      return;
    }

    try {
      setLoading(true);
      const created = await api.createFundraiser(need.id, {
        monobank_url: monobankUrl.trim(),
        target_amount: amountNum,
        title: title.trim() || undefined,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося створити дружню банку');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-1">
          Відкрити дружню банку
        </h2>
        <p className="text-sm text-slate-600 mb-5">
          Підрозділ: <strong className="text-slate-800">{need.unit_name}</strong> •{' '}
          Ціль: {need.title}
        </p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-5 text-xs text-emerald-900 space-y-1">
          <p className="font-semibold">Як це працює:</p>
          <p>1. Відкрий нову Банку у своєму застосунку Monobank на обрану суму.</p>
          <p>2. Скопіюй посилання на Банку та встав нижче.</p>
          <p>3. Збирай донати друзів, а після закриття завантаж квитанцію переказу.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Сума твого слоту (грн) *
            </label>
            <input
              type="number"
              min={500}
              step={100}
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              placeholder="Наприклад: 15000"
            />
            <p className="text-xs text-slate-500 mt-1">
              Залишилось зібрати по запиту: {remaining.toLocaleString('uk-UA')} грн
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Посилання на Банку Monobank *
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={monobankUrl}
                onChange={(e) => setMonobankUrl(e.target.value)}
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="https://send.monobank.ua/jar/..."
              />
              <ExternalLink className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Назва / коментар до твоєї банки (необов'язково)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              placeholder="Напр.: Банка від команди Frontend на Mavic"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {loading ? 'Створення...' : 'Забронювати слот'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
