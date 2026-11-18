import React, { useEffect, useState } from 'react';
import { Search, Filter, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import {
  CATEGORY_LABELS,
  Need,
  NeedCategory,
  NeedUrgency,
} from '../types/api';
import { NeedCard } from '../components/NeedCard';

export const MarketplacePage: React.FC = () => {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [urgency, setUrgency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNeeds = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getNeeds({ category, urgency });
        setNeeds(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка завантаження потреб');
      } finally {
        setLoading(false);
      }
    };
    fetchNeeds();
  }, [category, urgency]);

  const filteredNeeds = needs.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.unit_name.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-md">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>100% верифіковані запити підрозділів</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Бронюй слот та відкривай дружню банку для фронту
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Обирай конкретну потребу військового підрозділу, відкривай Банку у
            своєму Monobank, отримуй картку верифікації для Instagram Stories та
            допомагай закривати великі цілі разом.
          </p>
        </div>
      </section>

      <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук за назвою потреби або бригадою (напр. Mavic, 47 ОМБр)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Уся терміновість</option>
              <option value={'critical' satisfies NeedUrgency}>🔴 Критично</option>
              <option value={'medium' satisfies NeedUrgency}>🟡 Терміново</option>
              <option value={'low' satisfies NeedUrgency}>⚪ Планово</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              category === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Усі категорії
          </button>
          {(Object.keys(CATEGORY_LABELS) as NeedCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                category === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 bg-white rounded-2xl border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : filteredNeeds.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-600 font-medium">
            За обраними фільтрами потреб не знайдено.
          </p>
          <button
            onClick={() => {
              setCategory('all');
              setUrgency('all');
              setSearchQuery('');
            }}
            className="mt-3 text-sm text-emerald-600 font-semibold hover:underline"
          >
            Скинути фільтри
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNeeds.map((need) => (
            <NeedCard key={need.id} need={need} />
          ))}
        </div>
      )}
    </div>
  );
};
