import {
  CreateFundraiserPayload,
  CreateNeedPayload,
  Fundraiser,
  Need,
  NeedCategory,
  NeedUrgency,
  UpdateFundraiserPayload,
  User,
} from '../types/api';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://volunteer-hub.duckdns.org/api';

function getAuthToken(): string | null {
  return localStorage.getItem('vh_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Помилка запиту (${response.status})`;
    try {
      const errData = await response.json();
      if (typeof errData.detail === 'string') {
        errorMessage = errData.detail;
      } else if (Array.isArray(errData.detail)) {
        errorMessage = errData.detail.map((e: { msg: string }) => e.msg).join(', ');
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeFundraiser(raw: any): Fundraiser {
  const proof = raw.proof_url ?? raw.receipt_url ?? null;
  const isVerified = Boolean(raw.is_verified || raw.status === 'verified');
  return {
    id: raw.id,
    need_id: raw.need_id,
    volunteer_id: raw.volunteer_id ?? raw.user_id ?? 0,
    volunteer_name:
      raw.volunteer_name ??
      raw.volunteer?.full_name ??
      raw.user?.full_name ??
      'Волонтер',
    title: raw.title ?? '',
    monobank_url: raw.monobank_url ?? raw.jar_url ?? raw.link ?? '',
    target_amount: Number(raw.target_amount ?? raw.goal_amount ?? 0),
    current_amount: Number(raw.current_amount ?? raw.raised_amount ?? 0),
    status: isVerified
      ? 'verified'
      : proof
      ? 'proof_uploaded'
      : raw.status ?? 'active',
    proof_url: proof,
    created_at: raw.created_at,
    need_title: raw.need_title ?? raw.need?.title,
    unit_name: raw.unit_name ?? raw.need?.unit_name,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeNeed(raw: any): Need {
  const fundraisers = Array.isArray(raw.fundraisers)
    ? raw.fundraisers.map(normalizeFundraiser)
    : [];

  const calculatedCurrent =
    raw.current_amount ??
    raw.raised_amount ??
    fundraisers.reduce((acc: number, f: Fundraiser) => acc + f.current_amount, 0);

  return {
    id: raw.id,
    title: raw.title ?? 'Без назви',
    description: raw.description ?? '',
    category: (raw.category ?? 'gear') as NeedCategory,
    urgency: (raw.urgency ?? 'medium') as NeedUrgency,
    status: raw.status ?? 'open',
    target_amount: Number(raw.target_amount ?? raw.goal_amount ?? 0),
    current_amount: Number(calculatedCurrent),
    unit_name:
      raw.unit_name ??
      raw.brigade_name ??
      raw.military?.unit_name ??
      raw.owner?.unit_name ??
      'Підрозділ ЗСУ',
    is_verified_unit: raw.is_verified_unit ?? raw.is_verified ?? true,
    military_id: raw.military_id ?? raw.owner_id,
    created_at: raw.created_at,
    fundraisers,
  };
}

export const api = {
  async login(email: string, password: string): Promise<{ access_token: string; user?: User }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(payload: {
    email: string;
    password: string;
    full_name: string;
    role: 'volunteer' | 'military';
    unit_name?: string;
  }): Promise<{ access_token?: string; user?: User }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async googleLogin(credential: string): Promise<{ access_token: string; user?: User }> {
    return request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: credential, credential }),
    });
  },

  async getMe(): Promise<User> {
    return request('/auth/me');
  },

  async getNeeds(filters?: {
    category?: string;
    urgency?: string;
  }): Promise<Need[]> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'all') {
      params.set('category', filters.category);
    }
    if (filters?.urgency && filters.urgency !== 'all') {
      params.set('urgency', filters.urgency);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await request<unknown[]>(`/needs${query}`);
    return Array.isArray(data) ? data.map(normalizeNeed) : [];
  },

  async getNeedById(id: number | string): Promise<Need> {
    const data = await request<unknown>(`/needs/${id}`);
    return normalizeNeed(data);
  },

  async createNeed(payload: CreateNeedPayload): Promise<Need> {
    const data = await request<unknown>('/needs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeNeed(data);
  },

  async createFundraiser(
    needId: number,
    payload: CreateFundraiserPayload
  ): Promise<Fundraiser> {
    const data = await request<unknown>(`/needs/${needId}/fundraisers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeFundraiser(data);
  },

  async updateFundraiser(
    fundraiserId: number,
    payload: UpdateFundraiserPayload
  ): Promise<Fundraiser> {
    const data = await request<unknown>(`/fundraisers/${fundraiserId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeFundraiser(data);
  },

  async uploadFundraiserProof(
    fundraiserId: number,
    file: File
  ): Promise<Fundraiser> {
    const formData = new FormData();
    formData.append('file', file);
    const data = await request<unknown>(`/fundraisers/${fundraiserId}/proof`, {
      method: 'POST',
      body: formData,
    });
    return normalizeFundraiser(data);
  },

  async verifyFundraiser(fundraiserId: number): Promise<Fundraiser> {
    const data = await request<unknown>(`/fundraisers/${fundraiserId}/verify`, {
      method: 'POST',
    });
    return normalizeFundraiser(data);
  },
};
