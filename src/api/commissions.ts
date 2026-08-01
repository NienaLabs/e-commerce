// ─────────────────────────────────────────────
// Vendor Commissions API Client
//
// Vendors collect payment from customers outside the app, so there is no
// payout flowing to them. What they need to see is the mirror image: the
// commission they owe the platform on what they sold.
// ─────────────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1';

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

export async function getVendorCommissions(token: string): Promise<VendorCommissionOverview> {
  const res = await fetch(`${BASE_URL}/vendors/me/commissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load commissions');
  return res.json();
}
