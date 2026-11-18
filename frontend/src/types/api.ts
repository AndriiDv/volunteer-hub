export type UserRole = 'volunteer' | 'military' | 'admin';

export type NeedCategory = 'drones' | 'ew' | 'vehicles' | 'medicine' | 'gear';
export type NeedUrgency = 'low' | 'medium' | 'critical';
export type NeedStatus = 'open' | 'in_progress' | 'fulfilled' | 'closed';

export type FundraiserStatus = 'active' | 'proof_uploaded' | 'verified' | 'rejected';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  unit_name?: string | null;
  is_verified?: boolean;
  points?: number;
  avatar_url?: string | null;
}

export interface Fundraiser {
  id: number;
  need_id: number;
  volunteer_id: number;
  volunteer_name: string;
  title?: string;
  monobank_url: string;
  target_amount: number;
  current_amount: number;
  status: FundraiserStatus;
  proof_url?: string | null;
  created_at?: string;
  need_title?: string;
  unit_name?: string;
}

export interface Need {
  id: number;
  title: string;
  description: string;
  category: NeedCategory;
  urgency: NeedUrgency;
  status: NeedStatus;
  target_amount: number;
  current_amount: number;
  unit_name: string;
  is_verified_unit: boolean;
  military_id?: number;
  created_at?: string;
  fundraisers?: Fundraiser[];
}

export interface CreateNeedPayload {
  title: string;
  description: string;
  category: NeedCategory;
  urgency: NeedUrgency;
  target_amount: number;
}

export interface CreateFundraiserPayload {
  monobank_url: string;
  target_amount: number;
  title?: string;
}

export interface UpdateFundraiserPayload {
  current_amount?: number;
  monobank_url?: string;
  title?: string;
}

export const CATEGORY_LABELS: Record<NeedCategory, string> = {
  drones: 'Дрони та БПЛА',
  ew: 'РЕБ / РЕР',
  vehicles: 'Транспорт',
  medicine: 'Такмед',
  gear: 'Спорядження',
};

export const URGENCY_CONFIG: Record<
  NeedUrgency,
  { label: string; badgeClass: string }
> = {
  critical: {
    label: 'Критично',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
  },
  medium: {
    label: 'Терміново',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  low: {
    label: 'Планово',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};
