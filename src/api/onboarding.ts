const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

export interface OnboardingSubmitPayload {
  gdpr_consent: boolean;
  date_of_birth: string; // YYYY-MM-DD
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not';
  category_ids: string[];
  budget_preference?: 'budget' | 'mid' | 'premium';
  referral_source?: 'social' | 'friend' | 'ad' | 'search' | 'other';
}

export interface OnboardingStatusResponse {
  onboarding_done: boolean;
  gdpr_consent_at?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: any;
    try {
      detail = await res.json();
    } catch {
      detail = { message: res.statusText };
    }
    throw new Error(detail?.detail?.[0]?.msg || detail?.message || detail?.detail || 'API Request Failed');
  }
  return res.json();
}

export const getOnboardingStatus = async (token: string): Promise<OnboardingStatusResponse> => {
  const res = await fetch(`${BASE_URL}/users/me/onboarding-status`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return handleResponse<OnboardingStatusResponse>(res);
};

export const submitOnboarding = async (token: string, payload: OnboardingSubmitPayload): Promise<{ status: string }> => {
  const res = await fetch(`${BASE_URL}/users/me/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ status: string }>(res);
};
