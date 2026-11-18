import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, ArrowRight } from 'lucide-react';
import {
  CATEGORY_LABELS,
  Need,
  URGENCY_CONFIG,
} from '../types/api';

interface NeedCardProps {
  need: Need;
}

export const NeedCard: React.FC<NeedCardProps> = ({ need }) => {
  const percentage =
    need.target_amount > 0
      ? Math.min(100, Math.round((need.current_amount / need.target_amount) * 100))
      : 0;

  const urgency = URGENCY_CONFIG[need.urgency] || URGENCY_CONFIG.medium;
  const jarsCount = need.fundraisers?.length ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            {need.unit_name}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${urgency.badgeClass}`}
          >
            {urgency.label}
          </span>
        </div>

        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
          {CATEGORY_LABELS[need.category] || need.category}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
          {need.title}
        </h3>
        <p className="text-sm text-slate-600 line-clamp-2 mb-5">
          {need.description}
        </p>
      </div>

      <div>
        <div className="mb-4">
          <div className="flex justify-between text-xs font-medium mb-1.5">
            <span className="text-slate-700">
              Зібрано:{' '}
              <strong className="text-slate-900">
                {need.current_amount.toLocaleString('uk-UA')} грн
              </strong>
            </span>
            <span className="text-emerald-700 font-bold">{percentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-1.5">
            <span>Ціль: {need.target_amount.toLocaleString('uk-UA')} грн</span>
            <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
              <Users className="w-3.5 h-3.5" />
              {jarsCount} {jarsCount === 1 ? 'банка' : jarsCount >= 2 && jarsCount <= 4 ? 'банки' : 'банок'}
            </span>
          </div>
        </div>

        <Link
          to={`/needs/${need.id}`}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
        >
          <span>Відкрити банку / Деталі</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
