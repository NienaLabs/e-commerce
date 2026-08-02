// ─────────────────────────────────────────────
// Vendor Commissions API Client
//
// Vendors collect payment from customers outside the app, so there is no
// payout flowing to them. What they need to see is the mirror image: the
// commission they owe the platform on what they sold.
// ─────────────────────────────────────────────

import { Platform } from 'react-native';

// On web, the browser enforces CORS strictly: a page on http://localhost:8081
// fetching to http://127.0.0.1 is treated as CROSS-origin (different hostname),
// even though both resolve to the loopback address. Replacing 127.0.0.1 with
// localhost makes the request same-origin from the browser's perspective.
// The .env value is intentionally left as-is; we normalise here only.
const _rawBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1';
const BASE_URL = Platform.OS === 'web'
  ? _rawBase.replace('127.0.0.1', 'localhost')
  : _rawBase;


export type CommissionEntryStatus = 'pending' | 'billed' | 'paid';

export interface CommissionEntry {
  id: string;
  order_id: string | null;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  entry_type: 'charge' | 'credit';
  status: CommissionEntryStatus;
  period_date: string | null;
  billed_at: string | null;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
}

export interface CommissionPeriod {
  gross_sales: number;
  commission_due: number;
  orders: number;
}

export interface VendorCommissionOverview {
  vendor_id: string;
  /** Effective rate: the vendor's override if an admin set one, else the platform rate. */
  commission_rate: number;
  rate_is_custom: boolean;
  currency: string;
  /** Live accrual for today — what today's sales will cost in commission. */
  today: CommissionPeriod & { date: string };
  this_month: CommissionPeriod;
  /** Unsettled ledger balance (pending + billed) — the amount actually owed. */
  outstanding: number;
  pending_total: number;
  billed_total: number;
  paid_total: number;
  lifetime_gross: number;
  payment_due_days: number;
  due_date: string | null;
  is_overdue: boolean;
  days_overdue: number;
  entries: CommissionEntry[];
}

class CommissionApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'CommissionApiError';
    this.status = status;
  }
}

export { CommissionApiError };

export async function getVendorCommissions(token: string): Promise<VendorCommissionOverview> {
  if (!token) throw new CommissionApiError('No auth token', 401);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/vendors/me/commissions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (networkErr: any) {
    // Network-level failure (no connection, DNS failure, CORS preflight blocked, etc.)
    // Log the URL we actually tried: a wrong EXPO_PUBLIC_API_BASE_URL is by far
    // the most common cause, and "Failed to fetch" alone never reveals it.
    console.error(
      `[commissions] network error reaching ${BASE_URL}/vendors/me/commissions:`,
      networkErr?.message ?? networkErr,
    );
    throw new CommissionApiError(
      networkErr?.message ?? 'Network request failed',
      0, // 0 = no HTTP status (network error)
    );
  }

  if (!res.ok) {
    let detail: any;
    try {
      detail = await res.json();
    } catch {
      detail = { detail: res.statusText };
    }
    const msg = detail?.detail ?? detail?.message ?? `HTTP ${res.status}`;
    console.error(`[commissions] HTTP ${res.status}:`, msg);
    throw new CommissionApiError(msg, res.status);
  }

  return res.json() as Promise<VendorCommissionOverview>;
}
