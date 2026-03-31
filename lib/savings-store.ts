export type ProductId = "flexible" | "30d" | "6m" | "1y";

export interface SavingsProduct {
  id: ProductId;
  name: string;
  termLabel: string;
  termDays: number | null; // null = flexible
  rateAnnual: number; // e.g. 0.035
  minDeposit: number; // AED
  earlyRedemptionPenalty: "none" | "forfeit_yield";
  highlight: string;
}

export interface SavingsPosition {
  id: string;
  productId: ProductId;
  principal: number; // AED deposited
  balance: number;   // principal + credited yield
  pendingYield: number; // accrued today, credits tomorrow (T+1)
  depositedAt: string; // ISO date string
  maturesAt: string | null; // null for flexible
  status: "active" | "redeemed";
  redeemedAt?: string;
  yieldHistory: YieldEntry[];
}

export interface YieldEntry {
  date: string;
  amount: number;
  credited: boolean;
}

export const PRODUCTS: SavingsProduct[] = [
  {
    id: "flexible",
    name: "Flexible Savings",
    termLabel: "No lock-in",
    termDays: null,
    rateAnnual: 0.03,
    minDeposit: 100,
    earlyRedemptionPenalty: "none",
    highlight: "Withdraw anytime, no penalty",
  },
  {
    id: "30d",
    name: "30-Day Fixed",
    termLabel: "30 days",
    termDays: 30,
    rateAnnual: 0.045,
    minDeposit: 500,
    earlyRedemptionPenalty: "forfeit_yield",
    highlight: "Best for short-term goals",
  },
  {
    id: "6m",
    name: "6-Month Fixed",
    termLabel: "6 months",
    termDays: 182,
    rateAnnual: 0.06,
    minDeposit: 1000,
    earlyRedemptionPenalty: "forfeit_yield",
    highlight: "Higher yield, medium commitment",
  },
  {
    id: "1y",
    name: "1-Year Fixed",
    termLabel: "12 months",
    termDays: 365,
    rateAnnual: 0.08,
    minDeposit: 2500,
    earlyRedemptionPenalty: "forfeit_yield",
    highlight: "Maximum yield, full year",
  },
];

// In-memory mock state — resets on server restart (fine for prototype)
interface MockState {
  walletBalance: number;
  positions: SavingsPosition[];
  nextId: number;
}

const globalState = global as typeof global & { __savingsState?: MockState };

function getState(): MockState {
  if (!globalState.__savingsState) {
    // Seed with one existing position so the dashboard isn't empty
    const depositedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const principal = 2000;
    const rate = PRODUCTS.find((p) => p.id === "30d")!.rateAnnual;
    const dailyYield = parseFloat(((principal * rate) / 365).toFixed(4));

    const history: YieldEntry[] = [];
    for (let i = 4; i >= 1; i--) {
      const d = new Date(depositedAt.getTime() + i * 24 * 60 * 60 * 1000);
      history.push({
        date: d.toISOString().split("T")[0],
        amount: dailyYield,
        credited: true,
      });
    }
    const creditedTotal = parseFloat((dailyYield * 4).toFixed(4));
    const maturesAt = new Date(depositedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    globalState.__savingsState = {
      walletBalance: 4750.0,
      nextId: 2,
      positions: [
        {
          id: "pos-1",
          productId: "30d",
          principal,
          balance: parseFloat((principal + creditedTotal).toFixed(4)),
          pendingYield: dailyYield,
          depositedAt: depositedAt.toISOString(),
          maturesAt: maturesAt.toISOString(),
          status: "active",
          yieldHistory: history,
        },
      ],
    };
  }
  return globalState.__savingsState!;
}

export function getWalletBalance(): number {
  return getState().walletBalance;
}

export function getPositions(): SavingsPosition[] {
  return getState().positions;
}

export function getPosition(id: string): SavingsPosition | undefined {
  return getState().positions.find((p) => p.id === id);
}

export function createPosition(
  productId: ProductId,
  amount: number
): SavingsPosition {
  const state = getState();
  const product = PRODUCTS.find((p) => p.id === productId)!;

  if (amount > state.walletBalance) throw new Error("Insufficient wallet balance");
  if (amount < product.minDeposit)
    throw new Error(`Minimum deposit is AED ${product.minDeposit}`);

  state.walletBalance = parseFloat((state.walletBalance - amount).toFixed(4));

  const now = new Date();
  const maturesAt = product.termDays
    ? new Date(now.getTime() + product.termDays * 24 * 60 * 60 * 1000)
    : null;

  const dailyYield = parseFloat(((amount * product.rateAnnual) / 365).toFixed(4));

  const pos: SavingsPosition = {
    id: `pos-${state.nextId++}`,
    productId,
    principal: amount,
    balance: amount,
    pendingYield: dailyYield,
    depositedAt: now.toISOString(),
    maturesAt: maturesAt?.toISOString() ?? null,
    status: "active",
    yieldHistory: [],
  };

  state.positions.push(pos);
  return pos;
}

export function redeemPosition(id: string): {
  amountReturned: number;
  yieldForfeited: number;
  position: SavingsPosition;
} {
  const state = getState();
  const pos = state.positions.find((p) => p.id === id);
  if (!pos) throw new Error("Position not found");
  if (pos.status === "redeemed") throw new Error("Already redeemed");

  const product = PRODUCTS.find((p) => p.id === pos.productId)!;
  const now = new Date();
  const maturity = pos.maturesAt ? new Date(pos.maturesAt) : null;
  const isEarly = maturity ? now < maturity : false;

  let amountReturned: number;
  let yieldForfeited = 0;

  if (isEarly && product.earlyRedemptionPenalty === "forfeit_yield") {
    // Return principal only; forfeit all credited yield
    yieldForfeited = parseFloat((pos.balance - pos.principal).toFixed(4));
    amountReturned = pos.principal;
  } else {
    amountReturned = pos.balance;
  }

  pos.status = "redeemed";
  pos.redeemedAt = now.toISOString();
  state.walletBalance = parseFloat((state.walletBalance + amountReturned).toFixed(4));

  return { amountReturned, yieldForfeited, position: pos };
}
