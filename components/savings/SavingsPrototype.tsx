"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Clock,
  Home,
  Info,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import {
  formatAed,
  formatDate,
  daysElapsed,
  daysRemaining,
  progressPercent,
  projectedYield,
  dailyYield,
} from "@/lib/savings-calculations";
import type { SavingsPosition, SavingsProduct } from "@/lib/savings-store";

// ─── Design tokens ──────────────────────────────────────────────────────────
const phone = "mx-auto w-full max-w-[420px] min-h-screen bg-black text-white relative";
const card = "rounded-[28px] bg-[#0f1117]";
const GREEN = "#00c896";
const GREEN_DIM = "rgba(0,200,150,0.12)";
const GREEN_TEXT = "text-[#00c896]";
const RATE_COLORS: Record<string, string> = {
  flexible: "#5b9cf6",
  "30d": "#f5a623",
  "6m": "#00c896",
  "1y": "#c084fc",
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function pct(r: number) {
  return `${(r * 100).toFixed(1)}%`;
}

function productIcon(id: string) {
  if (id === "flexible") return <Zap className="h-5 w-5" />;
  if (id === "30d") return <Clock className="h-5 w-5" />;
  if (id === "6m") return <TrendingUp className="h-5 w-5" />;
  return <Sparkles className="h-5 w-5" />;
}

// ─── Bottom nav ─────────────────────────────────────────────────────────────
function BottomNav({ current, onNavigate }: { current: string; onNavigate: (s: string) => void }) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "calls", label: "Calls", icon: Phone },
    { id: "chats", label: "Chats", icon: MessageCircle },
    { id: "money", label: "Money", icon: Wallet },
    { id: "all", label: "All", icon: MoreHorizontal },
  ];
  return (
    <div className="sticky bottom-0 border-t border-white/10 bg-black/95 backdrop-blur px-3 py-3">
      <div className="grid grid-cols-5 gap-1">
        {items.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onNavigate(id)}
            className="flex flex-col items-center gap-1 py-1 text-xs">
            <Icon className={`h-5 w-5 ${current === id ? "text-white" : "text-white/45"}`} />
            <span className={current === id ? "text-white font-semibold" : "text-white/45"}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page shell ─────────────────────────────────────────────────────────────
function PageShell({
  onBack, title, subtitle, navCurrent = "money", onNavigate, children, gradient,
}: {
  onBack?: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  navCurrent?: string;
  onNavigate?: (s: string) => void;
  children: React.ReactNode;
  gradient?: string;
}) {
  return (
    <div className={`${phone}`}
      style={{ background: gradient ?? "linear-gradient(180deg,#000 0%,#03161f 22%,#000 70%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="rounded-full bg-white/10 p-2">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {title && (
            <div className="flex items-center gap-2">
              <span className="text-[28px] font-bold tracking-tight">botim</span>
              <span className="rounded-full bg-[#00c896] px-3 py-0.5 text-xs font-bold text-black uppercase tracking-wider">
                {subtitle ?? "SAVINGS"}
              </span>
            </div>
          )}
        </div>
        <div className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_35%_35%,#d4ff8e,#457a33)] ring-2 ring-white/10" />
      </div>

      <div className="px-5 pb-28 overflow-auto">{children}</div>

      <BottomNav current={navCurrent} onNavigate={onNavigate ?? (() => {})} />
    </div>
  );
}

// ─── Screen: Savings Hub ─────────────────────────────────────────────────────
function SavingsHub({
  onNavigate,
  positions,
  walletBalance,
  loading,
}: {
  onNavigate: (s: string, data?: unknown) => void;
  positions: SavingsPosition[];
  walletBalance: number;
  loading: boolean;
}) {
  const activePositions = positions.filter((p) => p.status === "active");
  const totalSaved = activePositions.reduce((s, p) => s + p.balance, 0);
  const totalPending = activePositions.reduce((s, p) => s + p.pendingYield, 0);

  return (
    <PageShell
      title="botim"
      subtitle="SAVINGS"
      navCurrent="money"
      onNavigate={(s) => onNavigate(s)}
      gradient="linear-gradient(180deg,#001a12 0%,#002b1e 22%,#000 65%)"
    >
      <div className="pt-4">
        {/* Hero balance card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-[32px] border border-white/10 p-6"
          style={{
            background:
              "linear-gradient(135deg,rgba(0,60,42,0.95) 0%,rgba(0,28,20,0.92) 100%)",
          }}
        >
          <div className="mb-1 text-sm text-white/60">Total savings balance</div>
          <div className="text-4xl font-semibold tracking-tight">
            {loading ? (
              <span className="animate-pulse">Loading…</span>
            ) : (
              formatAed(totalSaved)
            )}
          </div>
          {totalSaved > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: GREEN_DIM, color: GREEN }}
              >
                +{formatAed(totalPending)} pending today
              </div>
              <span className="text-xs text-white/40">credited T+1</span>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/8 px-4 py-3">
            <span className="text-sm text-white/60">Wallet balance</span>
            <span className="text-base font-semibold">{formatAed(walletBalance)}</span>
          </div>
        </motion.div>

        {/* CTA */}
        <button
          onClick={() => onNavigate("selectProduct")}
          className="mb-6 flex w-full items-center justify-between rounded-[24px] px-6 py-5 text-left text-black font-semibold text-lg transition hover:scale-[1.01]"
          style={{ background: `linear-gradient(135deg,${GREEN},#00a87e)` }}
        >
          <span>Open new savings plan</span>
          <Plus className="h-6 w-6" />
        </button>

        {/* Active plans */}
        {activePositions.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 text-xl font-semibold">My plans</div>
            <div className="flex flex-col gap-3">
              {activePositions.map((pos) => (
                <PositionCard
                  key={pos.id}
                  position={pos}
                  onClick={() => onNavigate("planDetail", pos)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && activePositions.length === 0 && (
          <div className={`${card} p-6 text-center`}>
            <div className="mb-2 text-4xl">🌱</div>
            <div className="text-lg font-semibold">Start growing your money</div>
            <div className="mt-1 text-sm text-white/55">
              Earn up to 8% p.a. with Botim Savings — powered by stablecoin yield, paid daily.
            </div>
          </div>
        )}

        {/* How it works */}
        <div className={`${card} p-5 mt-2`}>
          <div className="mb-4 text-lg font-semibold">How it works</div>
          <div className="flex flex-col gap-3">
            {[
              { icon: <TrendingUp className="h-4 w-4" />, text: "Deposit AED — earn yield in AED" },
              { icon: <Sparkles className="h-4 w-4" />, text: "Yield accrues daily, credited T+1" },
              { icon: <ShieldCheck className="h-4 w-4" />, text: "Powered by stablecoin staking — you hold AED" },
              { icon: <BadgeCheck className="h-4 w-4" />, text: "Yield auto-reinvested for compounding" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-white/75">
                <div className="rounded-full p-1.5" style={{ background: GREEN_DIM, color: GREEN }}>{icon}</div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Position card (mini) ────────────────────────────────────────────────────
function PositionCard({ position, onClick }: { position: SavingsPosition; onClick: () => void }) {
  const color = RATE_COLORS[position.productId] ?? GREEN;
  const elapsed = daysElapsed(position.depositedAt);
  const remaining = daysRemaining(position.maturesAt);
  const progress = progressPercent(position.depositedAt, position.maturesAt);
  const earned = parseFloat((position.balance - position.principal).toFixed(2));

  return (
    <button
      onClick={onClick}
      className="w-full rounded-[24px] border border-white/8 bg-[#0d1510] p-5 text-left transition hover:bg-[#111a15]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full p-2" style={{ background: `${color}22`, color }}>
            {productIcon(position.productId)}
          </div>
          <div>
            <div className="text-sm font-semibold capitalize">
              {position.productId === "flexible"
                ? "Flexible Savings"
                : position.productId === "30d"
                ? "30-Day Fixed"
                : position.productId === "6m"
                ? "6-Month Fixed"
                : "1-Year Fixed"}
            </div>
            <div className="text-xs text-white/45">
              {position.maturesAt
                ? `Matures ${formatDate(position.maturesAt)}`
                : "No lock-in"}
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-white/30" />
      </div>

      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-xs text-white/50">Balance</div>
          <div className="text-xl font-semibold">{formatAed(position.balance)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/50">Earned</div>
          <div className="text-base font-semibold" style={{ color: GREEN }}>
            +{formatAed(earned)}
          </div>
        </div>
      </div>

      {position.maturesAt && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-white/40">
            <span>Day {elapsed}</span>
            <span>{remaining != null ? `${remaining}d left` : "Matured"}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(progress, 4)}%`, background: color }}
            />
          </div>
        </div>
      )}
    </button>
  );
}

// ─── Screen: Product Selector ────────────────────────────────────────────────
function ProductSelector({
  onBack,
  onNavigate,
  products,
}: {
  onBack: () => void;
  onNavigate: (s: string, data?: unknown) => void;
  products: SavingsProduct[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedProduct = products.find((p) => p.id === selected);

  return (
    <PageShell onBack={onBack} title="botim" navCurrent="money">
      <div className="pt-4">
        <div className="mb-1 text-xs uppercase tracking-widest text-white/40">Step 1 of 3</div>
        <div className="mb-6 text-3xl font-semibold leading-tight">
          Choose your<br />savings plan
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {products.map((p) => {
            const color = RATE_COLORS[p.id] ?? GREEN;
            const isSelected = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className="w-full rounded-[24px] border p-5 text-left transition"
                style={{
                  borderColor: isSelected ? color : "rgba(255,255,255,0.08)",
                  background: isSelected ? `${color}12` : "#0f1117",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2.5" style={{ background: `${color}22`, color }}>
                      {productIcon(p.id)}
                    </div>
                    <div>
                      <div className="font-semibold text-base">{p.name}</div>
                      <div className="text-xs text-white/50 mt-0.5">{p.termLabel}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color }}>
                      {pct(p.rateAnnual)}
                    </div>
                    <div className="text-xs text-white/45">p.a.</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-white/55">
                    {p.earlyRedemptionPenalty === "none" ? (
                      <><Zap className="h-3 w-3" />{p.highlight}</>
                    ) : (
                      <><Lock className="h-3 w-3" />{p.highlight}</>
                    )}
                  </div>
                  <div className="text-xs text-white/40">
                    Min {formatAed(p.minDeposit)}
                  </div>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 pt-3 border-t border-white/10 text-xs text-white/60 leading-relaxed"
                  >
                    {p.earlyRedemptionPenalty === "none"
                      ? "Redeem anytime with no penalty. Yield accrues daily and is credited the next day."
                      : "Early redemption forfeits all accrued yield — you receive your principal back in full. Yield is yours if you hold to maturity."}
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        <button
          disabled={!selectedProduct}
          onClick={() => selectedProduct && onNavigate("deposit", selectedProduct)}
          className="w-full rounded-full py-5 text-lg font-semibold transition disabled:opacity-30"
          style={{
            background: selectedProduct ? `linear-gradient(135deg,${GREEN},#00a87e)` : "#1a1a1a",
            color: selectedProduct ? "#000" : "#fff",
          }}
        >
          Continue
        </button>
      </div>
    </PageShell>
  );
}

// ─── Screen: Deposit ─────────────────────────────────────────────────────────
function DepositScreen({
  onBack,
  onNavigate,
  product,
  walletBalance,
}: {
  onBack: () => void;
  onNavigate: (s: string, data?: unknown) => void;
  product: SavingsProduct;
  walletBalance: number;
}) {
  const [raw, setRaw] = useState("");
  const amount = parseFloat(raw) || 0;
  const color = RATE_COLORS[product.id] ?? GREEN;
  const projected = projectedYield(amount, product.rateAnnual, product.termDays);
  const daily = dailyYield(amount, product.rateAnnual);

  const error =
    amount > 0 && amount < product.minDeposit
      ? `Minimum is ${formatAed(product.minDeposit)}`
      : amount > walletBalance
      ? "Insufficient wallet balance"
      : null;

  const canContinue = amount >= product.minDeposit && amount <= walletBalance;

  function handleQuick(v: number) {
    setRaw(String(Math.min(v, walletBalance)));
  }

  return (
    <PageShell onBack={onBack} title="botim" navCurrent="money">
      <div className="pt-4">
        <div className="mb-1 text-xs uppercase tracking-widest text-white/40">Step 2 of 3</div>
        <div className="mb-2 text-3xl font-semibold">How much to save?</div>
        <div className="mb-6 flex items-center gap-2 text-sm">
          <div className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${color}22`, color }}>
            {product.name}
          </div>
          <span className="text-white/45">·</span>
          <span className="font-semibold" style={{ color }}>{pct(product.rateAnnual)} p.a.</span>
        </div>

        {/* Big number input */}
        <div className="mb-2 rounded-[28px] bg-[#0f1117] p-6">
          <div className="mb-1 text-xs text-white/45">Amount (AED)</div>
          <div className="flex items-end gap-2">
            <span className="text-2xl text-white/40 mb-1">AED</span>
            <input
              type="number"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-4xl font-semibold outline-none placeholder-white/20 text-white w-0"
            />
          </div>
          {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
          <div className="mt-3 flex items-center justify-between text-xs text-white/45">
            <span>Wallet: {formatAed(walletBalance)}</span>
            <button onClick={() => setRaw(String(walletBalance))} className="text-[#00c896]">Max</button>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {[500, 1000, 2500, 5000].map((v) => (
            <button
              key={v}
              onClick={() => handleQuick(v)}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/30"
            >
              {formatAed(v)}
            </button>
          ))}
        </div>

        {/* Yield preview */}
        {amount >= product.minDeposit && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-[24px] p-5"
            style={{ background: `${color}10`, border: `1px solid ${color}30` }}
          >
            <div className="mb-3 text-sm font-medium" style={{ color }}>Yield preview</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-xs text-white/50">Daily yield</div>
                <div className="mt-1 text-lg font-semibold">+{formatAed(daily)}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-xs text-white/50">
                  {product.termDays ? `At maturity (${product.termLabel})` : "Est. 30-day yield"}
                </div>
                <div className="mt-1 text-lg font-semibold" style={{ color }}>+{formatAed(projected)}</div>
              </div>
            </div>
            {product.earlyRedemptionPenalty !== "none" && (
              <div className="mt-3 flex items-start gap-2 text-xs text-white/50">
                <Lock className="h-3 w-3 mt-0.5 shrink-0" />
                Early redemption forfeits all accrued yield
              </div>
            )}
          </motion.div>
        )}

        <button
          disabled={!canContinue}
          onClick={() => canContinue && onNavigate("confirm", { product, amount })}
          className="w-full rounded-full py-5 text-lg font-semibold transition disabled:opacity-30"
          style={{
            background: canContinue ? `linear-gradient(135deg,${GREEN},#00a87e)` : "#1a1a1a",
            color: canContinue ? "#000" : "#fff",
          }}
        >
          Review & Confirm
        </button>
      </div>
    </PageShell>
  );
}

// ─── Screen: Confirm Deposit ──────────────────────────────────────────────────
function ConfirmDeposit({
  onBack,
  onNavigate,
  product,
  amount,
}: {
  onBack: () => void;
  onNavigate: (s: string, data?: unknown) => void;
  product: SavingsProduct;
  amount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const color = RATE_COLORS[product.id] ?? GREEN;
  const projected = projectedYield(amount, product.rateAnnual, product.termDays);
  const maturityDate = product.termDays
    ? new Date(Date.now() + product.termDays * 24 * 60 * 60 * 1000)
    : null;

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/savings/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onNavigate("success", { position: data.position, product, amount });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const rows = [
    { label: "Product", value: product.name },
    { label: "Amount", value: formatAed(amount) },
    { label: "Annual rate", value: pct(product.rateAnnual) },
    {
      label: maturityDate ? "Matures on" : "Lock-in",
      value: maturityDate ? formatDate(maturityDate.toISOString()) : "None — redeem anytime",
    },
    {
      label: product.termDays ? "Projected yield" : "Est. 30-day yield",
      value: `+${formatAed(projected)}`,
      accent: true,
    },
  ];

  return (
    <PageShell onBack={onBack} title="botim" navCurrent="money">
      <div className="pt-4">
        <div className="mb-1 text-xs uppercase tracking-widest text-white/40">Step 3 of 3</div>
        <div className="mb-6 text-3xl font-semibold">Review your plan</div>

        <div className="mb-5 rounded-[28px] bg-[#0f1117] divide-y divide-white/8">
          {rows.map(({ label, value, accent }) => (
            <div key={label} className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-white/55">{label}</span>
              <span
                className={`text-sm font-semibold ${accent ? "" : "text-white"}`}
                style={accent ? { color } : undefined}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {product.earlyRedemptionPenalty !== "none" && (
          <div className="mb-5 rounded-[24px] border border-orange-500/25 bg-orange-500/8 p-4 flex items-start gap-3">
            <Info className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
            <div className="text-xs text-orange-200/80 leading-relaxed">
              This is a fixed-term plan. Redeeming before{" "}
              {maturityDate ? formatDate(maturityDate.toISOString()) : "maturity"} will forfeit all
              accrued yield. Your principal is always returned in full.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full rounded-full py-5 text-lg font-semibold transition disabled:opacity-50"
          style={{ background: `linear-gradient(135deg,${GREEN},#00a87e)`, color: "#000" }}
        >
          {loading ? "Processing…" : "Confirm & Start saving"}
        </button>
      </div>
    </PageShell>
  );
}

// ─── Screen: Success ──────────────────────────────────────────────────────────
function DepositSuccess({
  onNavigate,
  product,
  amount,
  position,
}: {
  onNavigate: (s: string, data?: unknown) => void;
  product: SavingsProduct;
  amount: number;
  position: SavingsPosition;
}) {
  const color = RATE_COLORS[product.id] ?? GREEN;

  return (
    <PageShell title="botim" navCurrent="money" onNavigate={(s) => onNavigate(s)}>
      <div className="pt-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
          style={{ background: `${color}20` }}
        >
          <BadgeCheck className="h-12 w-12" style={{ color }} />
        </motion.div>

        <div className="mb-2 text-3xl font-semibold">You're saving!</div>
        <div className="mb-8 text-white/55 text-sm">
          {formatAed(amount)} is now working for you in {product.name}
        </div>

        <div className="w-full rounded-[28px] bg-[#0f1117] divide-y divide-white/8 mb-8 text-left">
          {[
            { label: "Plan", value: product.name },
            { label: "Deposited", value: formatAed(amount) },
            { label: "Rate", value: pct(product.rateAnnual) + " p.a." },
            {
              label: "First yield credit",
              value: formatDate(
                new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              ),
            },
            ...(position.maturesAt
              ? [{ label: "Matures", value: formatDate(position.maturesAt) }]
              : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between px-5 py-4">
              <span className="text-sm text-white/50">{label}</span>
              <span className="text-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onNavigate("hub")}
          className="w-full rounded-full py-5 text-lg font-semibold"
          style={{ background: `linear-gradient(135deg,${GREEN},#00a87e)`, color: "#000" }}
        >
          View my savings
        </button>
      </div>
    </PageShell>
  );
}

// ─── Screen: Plan Detail ──────────────────────────────────────────────────────
function PlanDetail({
  onBack,
  onNavigate,
  position: initialPosition,
}: {
  onBack: () => void;
  onNavigate: (s: string, data?: unknown) => void;
  position: SavingsPosition;
}) {
  const [position, setPosition] = useState(initialPosition);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Refresh from API
    fetch(`/api/savings/positions/${initialPosition.id}`)
      .then((r) => r.json())
      .then((d) => d.position && setPosition(d.position))
      .catch(() => {});
  }, [initialPosition.id]);

  const color = RATE_COLORS[position.productId] ?? GREEN;
  const earned = parseFloat((position.balance - position.principal).toFixed(2));
  const remaining = daysRemaining(position.maturesAt);
  const elapsed = daysElapsed(position.depositedAt);
  const progress = progressPercent(position.depositedAt, position.maturesAt);
  const isFixed = position.maturesAt !== null;
  const isMatured = remaining === 0;

  const productName =
    position.productId === "flexible"
      ? "Flexible Savings"
      : position.productId === "30d"
      ? "30-Day Fixed"
      : position.productId === "6m"
      ? "6-Month Fixed"
      : "1-Year Fixed";

  return (
    <PageShell onBack={onBack} title="botim" navCurrent="money">
      <div className="pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full p-3" style={{ background: `${color}20`, color }}>
            {productIcon(position.productId)}
          </div>
          <div>
            <div className="text-2xl font-semibold">{productName}</div>
            <div className="text-sm text-white/45">
              Since {formatDate(position.depositedAt)}
            </div>
          </div>
        </div>

        {/* Balance card */}
        <div
          className="mb-5 rounded-[28px] p-6"
          style={{
            background: "linear-gradient(135deg,rgba(0,50,35,0.95),rgba(0,20,14,0.9))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="text-sm text-white/55 mb-1">Current balance</div>
          <div className="text-4xl font-semibold mb-4">{formatAed(position.balance)}</div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/8 p-3">
              <div className="text-xs text-white/45 mb-1">Principal</div>
              <div className="text-sm font-semibold">{formatAed(position.principal)}</div>
            </div>
            <div className="rounded-xl bg-white/8 p-3">
              <div className="text-xs text-white/45 mb-1">Earned</div>
              <div className="text-sm font-semibold" style={{ color: GREEN }}>
                +{formatAed(earned)}
              </div>
            </div>
            <div className="rounded-xl bg-white/8 p-3">
              <div className="text-xs text-white/45 mb-1">Pending</div>
              <div className="text-sm font-semibold text-yellow-300">
                +{formatAed(position.pendingYield)}
              </div>
            </div>
          </div>
        </div>

        {/* Progress (fixed plans) */}
        {isFixed && (
          <div className="mb-5 rounded-[24px] bg-[#0f1117] p-5">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-white/55">Progress to maturity</span>
              <span className="font-semibold" style={{ color }}>
                {isMatured ? "Matured" : `${remaining}d remaining`}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10 mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(progress, 4)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/40">
              <span>Day {elapsed}</span>
              <span>
                {position.maturesAt ? formatDate(position.maturesAt) : ""}
              </span>
            </div>
          </div>
        )}

        {/* Yield history */}
        {position.yieldHistory.length > 0 && (
          <div className="mb-5 rounded-[24px] bg-[#0f1117] p-5">
            <div className="mb-3 text-base font-semibold">Yield credits</div>
            <div className="flex flex-col gap-2">
              {position.yieldHistory.slice(-5).reverse().map((y) => (
                <div key={y.date} className="flex items-center justify-between text-sm">
                  <span className="text-white/50">{formatDate(y.date)}</span>
                  <span className="font-medium" style={{ color: GREEN }}>
                    +{formatAed(y.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key info */}
        <div className="mb-6 rounded-[24px] bg-[#0f1117] p-5">
          <div className="flex flex-col gap-3">
            {[
              { label: "Annual rate", value: pct(RATE_COLORS[position.productId] ? [0.03, 0.045, 0.06, 0.08][["flexible", "30d", "6m", "1y"].indexOf(position.productId)] : 0.03) },
              { label: "Daily yield", value: `+${formatAed(position.pendingYield)}` },
              { label: "Yield reinvested", value: "Yes — daily compounding" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-white/50">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Redeem */}
        {position.status === "active" && (
          <button
            disabled={loading}
            onClick={() => onNavigate("redeem", position)}
            className="w-full rounded-full border border-white/20 py-4 text-base font-semibold text-white/80 transition hover:bg-white/5 disabled:opacity-40"
          >
            {loading ? "Processing…" : isFixed && !isMatured ? "Redeem early" : "Redeem"}
          </button>
        )}

        {position.status === "redeemed" && (
          <div className="rounded-full bg-white/8 py-4 text-center text-sm text-white/40">
            Redeemed on {position.redeemedAt ? formatDate(position.redeemedAt) : "—"}
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ─── Screen: Redeem Confirm ───────────────────────────────────────────────────
function RedeemConfirm({
  onBack,
  onNavigate,
  position,
}: {
  onBack: () => void;
  onNavigate: (s: string, data?: unknown) => void;
  position: SavingsPosition;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = daysRemaining(position.maturesAt);
  const isEarly = remaining !== null && remaining > 0;
  const earned = parseFloat((position.balance - position.principal).toFixed(2));
  const amountBack = isEarly ? position.principal : position.balance;
  const forfeited = isEarly ? earned : 0;

  async function handleRedeem() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/savings/positions/${position.id}/redeem`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onNavigate("redeemSuccess", {
        amountReturned: data.amountReturned,
        yieldForfeited: data.yieldForfeited,
        walletBalance: data.walletBalance,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell onBack={onBack} title="botim" navCurrent="money">
      <div className="pt-4">
        <div className="mb-6 text-3xl font-semibold">
          {isEarly ? "Early redemption" : "Redeem savings"}
        </div>

        {isEarly && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-[24px] border border-orange-500/30 bg-orange-500/10 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-orange-500/20 p-1.5">
                <X className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <div className="font-semibold text-orange-300 mb-1">You'll forfeit your yield</div>
                <div className="text-sm text-orange-200/70 leading-relaxed">
                  Redeeming {remaining}d before maturity means all{" "}
                  <span className="font-semibold text-orange-300">{formatAed(forfeited)}</span> in
                  accrued yield is forfeited. Your original principal of{" "}
                  <span className="font-semibold">{formatAed(position.principal)}</span> is
                  returned in full.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mb-6 rounded-[28px] bg-[#0f1117] divide-y divide-white/8">
          {[
            { label: "From plan", value: position.productId === "flexible" ? "Flexible Savings" : position.productId === "30d" ? "30-Day Fixed" : position.productId === "6m" ? "6-Month Fixed" : "1-Year Fixed" },
            { label: "You get back", value: formatAed(amountBack), accent: true },
            ...(forfeited > 0
              ? [{ label: "Yield forfeited", value: `-${formatAed(forfeited)}`, negative: true }]
              : []),
            { label: "Credited to", value: "Botim Wallet" },
          ].map(({ label, value, accent, negative }) => (
            <div key={label} className="flex justify-between px-5 py-4">
              <span className="text-sm text-white/50">{label}</span>
              <span
                className={`text-sm font-semibold ${negative ? "text-red-400" : "text-white"}`}
                style={accent ? { color: GREEN } : undefined}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleRedeem}
          disabled={loading}
          className="mb-3 w-full rounded-full py-5 text-lg font-semibold transition disabled:opacity-50"
          style={{
            background: isEarly ? "rgba(239,68,68,0.15)" : `linear-gradient(135deg,${GREEN},#00a87e)`,
            color: isEarly ? "#f87171" : "#000",
            border: isEarly ? "1px solid rgba(239,68,68,0.3)" : "none",
          }}
        >
          {loading ? "Processing…" : isEarly ? "Confirm early redemption" : "Confirm redemption"}
        </button>

        <button onClick={onBack} className="w-full rounded-full py-4 text-sm text-white/50">
          Cancel — keep saving
        </button>
      </div>
    </PageShell>
  );
}

// ─── Screen: Redeem Success ───────────────────────────────────────────────────
function RedeemSuccess({
  onNavigate,
  amountReturned,
  yieldForfeited,
  walletBalance,
}: {
  onNavigate: (s: string, data?: unknown) => void;
  amountReturned: number;
  yieldForfeited: number;
  walletBalance: number;
}) {
  return (
    <PageShell title="botim" navCurrent="money" onNavigate={(s) => onNavigate(s)}>
      <div className="pt-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/8"
        >
          <Wallet className="h-12 w-12 text-white/70" />
        </motion.div>

        <div className="mb-2 text-3xl font-semibold">Funds returned</div>
        <div className="mb-2 text-5xl font-bold" style={{ color: GREEN }}>
          {formatAed(amountReturned)}
        </div>
        <div className="mb-8 text-sm text-white/45">added to your Botim Wallet</div>

        {yieldForfeited > 0 && (
          <div className="mb-6 w-full rounded-[24px] border border-orange-500/20 bg-orange-500/8 p-4 text-sm text-orange-300/80">
            {formatAed(yieldForfeited)} in accrued yield was forfeited due to early redemption.
          </div>
        )}

        <div className="w-full rounded-[28px] bg-[#0f1117] p-5 mb-8 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">New wallet balance</span>
            <span className="font-semibold">{formatAed(walletBalance)}</span>
          </div>
        </div>

        <button
          onClick={() => onNavigate("hub")}
          className="w-full rounded-full py-5 text-lg font-semibold"
          style={{ background: `linear-gradient(135deg,${GREEN},#00a87e)`, color: "#000" }}
        >
          Back to savings
        </button>
      </div>
    </PageShell>
  );
}

// ─── Router / Root ────────────────────────────────────────────────────────────
type Screen =
  | "hub"
  | "selectProduct"
  | "deposit"
  | "confirm"
  | "success"
  | "planDetail"
  | "redeem"
  | "redeemSuccess";

export default function SavingsPrototype() {
  const [history, setHistory] = useState<{ screen: Screen; data?: unknown }[]>([
    { screen: "hub" },
  ]);
  const [products, setProducts] = useState<SavingsProduct[]>([]);
  const [positions, setPositions] = useState<SavingsPosition[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const current = history[history.length - 1];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, positionsRes] = await Promise.all([
        fetch("/api/savings/products"),
        fetch("/api/savings/positions"),
      ]);
      const [pd, pos] = await Promise.all([productsRes.json(), positionsRes.json()]);
      setProducts(pd.products);
      setPositions(pos.positions);
      setWalletBalance(pos.walletBalance);
    } catch {
      // silently fail in prototype
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function navigate(screen: string, data?: unknown) {
    if (screen === "hub") {
      loadData();
      setHistory([{ screen: "hub" }]);
    } else {
      setHistory((h) => [...h, { screen: screen as Screen, data }]);
    }
  }

  function back() {
    if (history.length > 1) setHistory((h) => h.slice(0, -1));
  }

  const node = useMemo(() => {
    const { screen, data } = current;
    switch (screen) {
      case "hub":
        return (
          <SavingsHub
            onNavigate={navigate}
            positions={positions}
            walletBalance={walletBalance}
            loading={loading}
          />
        );
      case "selectProduct":
        return (
          <ProductSelector onBack={back} onNavigate={navigate} products={products} />
        );
      case "deposit":
        return (
          <DepositScreen
            onBack={back}
            onNavigate={navigate}
            product={data as SavingsProduct}
            walletBalance={walletBalance}
          />
        );
      case "confirm": {
        const { product, amount } = data as { product: SavingsProduct; amount: number };
        return (
          <ConfirmDeposit
            onBack={back}
            onNavigate={(s, d) => {
              navigate(s, d);
              loadData(); // refresh wallet balance
            }}
            product={product}
            amount={amount}
          />
        );
      }
      case "success": {
        const { position, product, amount } = data as {
          position: SavingsPosition;
          product: SavingsProduct;
          amount: number;
        };
        return (
          <DepositSuccess
            onNavigate={navigate}
            product={product}
            amount={amount}
            position={position}
          />
        );
      }
      case "planDetail":
        return (
          <PlanDetail
            onBack={back}
            onNavigate={navigate}
            position={data as SavingsPosition}
          />
        );
      case "redeem":
        return (
          <RedeemConfirm
            onBack={back}
            onNavigate={navigate}
            position={data as SavingsPosition}
          />
        );
      case "redeemSuccess": {
        const { amountReturned, yieldForfeited, walletBalance: wb } = data as {
          amountReturned: number;
          yieldForfeited: number;
          walletBalance: number;
        };
        return (
          <RedeemSuccess
            onNavigate={navigate}
            amountReturned={amountReturned}
            yieldForfeited={yieldForfeited}
            walletBalance={wb}
          />
        );
      }
    }
  }, [current, products, positions, walletBalance, loading]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
      <div className="mx-auto mb-4 max-w-[420px] text-center text-xs text-white/30">
        Botim Savings · Full-stack prototype
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={current.screen}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {node}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
