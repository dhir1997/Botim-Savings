"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowDown,
  BadgeCheck,
  ChevronRight,
  Clock,
  CreditCard,
  Globe,
  Home,
  Info,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Phone,
  PieChart,
  Plus,
  QrCode,
  Send,
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

// ─── Tab pill ────────────────────────────────────────────────────────────────
function TabPill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-5 py-2 text-sm font-semibold transition"
      style={
        active
          ? { background: "rgba(255,255,255,0.14)", color: "#fff" }
          : { background: "transparent", color: "rgba(255,255,255,0.45)" }
      }
    >
      {children}
    </button>
  );
}

// ─── Pay tab ─────────────────────────────────────────────────────────────────
function PayTab({
  walletBalance,
  onNavigate,
}: {
  walletBalance: number;
  onNavigate: (s: string, data?: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Wallet balance card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[30px] border border-white/10 p-6"
        style={{ background: "linear-gradient(135deg,rgba(20,40,60,0.95),rgba(5,15,25,0.92))" }}
      >
        <div className="text-sm text-white/55 mb-1">Wallet balance</div>
        <div className="text-4xl font-semibold tracking-tight mb-4">{formatAed(walletBalance)}</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/8 px-3 py-2.5">
            <div className="text-xs text-white/45">Pending</div>
            <div className="text-sm font-semibold mt-0.5">AED 0.00</div>
          </div>
          <div className="rounded-xl bg-white/8 px-3 py-2.5">
            <div className="text-xs text-white/45">Daily limit left</div>
            <div className="text-sm font-semibold mt-0.5">AED 8,500</div>
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Send, label: "Send" },
          { icon: QrCode, label: "QR code" },
          { icon: Plus, label: "Add funds" },
          { icon: ArrowDown, label: "Withdraw" },
        ].map(({ icon: Icon, label }) => (
          <button key={label} className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-full items-center justify-center rounded-[18px] bg-white/10 text-white/80">
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs text-white/70">{label}</span>
          </button>
        ))}
      </div>

      {/* Savings entry widget */}
      <button
        onClick={() => onNavigate("selectProduct")}
        className="w-full rounded-[28px] p-5 text-left transition hover:scale-[1.01]"
        style={{ background: "linear-gradient(135deg,rgba(0,50,35,0.9),rgba(0,22,15,0.95))", border: "1px solid rgba(0,200,150,0.2)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl p-3" style={{ background: `${GREEN_DIM}`, color: GREEN }}>
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: GREEN }}>
                Botim Savings
              </div>
              <div className="text-xl font-semibold">Earn up to 8% p.a.</div>
              <div className="text-sm text-white/55 mt-0.5">Yield daily · AED · No crypto exposure</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/30 shrink-0" />
        </div>
        <div className="mt-4 flex gap-2">
          {["3% Flexible", "4.5% 30D", "6% 6M", "8% 1Y"].map((t) => (
            <span key={t} className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "rgba(0,200,150,0.12)", color: GREEN }}>
              {t}
            </span>
          ))}
        </div>
      </button>

      {/* International transfer */}
      <button className="w-full rounded-[28px] bg-white/95 p-5 text-left text-black transition hover:scale-[1.01]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#eef1ff] p-3 text-[#2040e8]">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#2040e8]">AED → INR</div>
              <div className="text-xl font-semibold mt-0.5">1 AED = 25.34 INR</div>
              <div className="text-sm text-black/55">Send money internationally</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-black/40" />
        </div>
      </button>

      {/* Services */}
      <div className="rounded-[28px] bg-[#0f1117] p-5">
        <div className="mb-3 text-base font-semibold">Services</div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: CreditCard, label: "Cards" },
            { icon: Send, label: "Send" },
            { icon: Phone, label: "Top-up" },
            { icon: MoreHorizontal, label: "More" },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="flex flex-col items-center gap-1.5 rounded-[16px] bg-white/5 py-3 hover:bg-white/8">
              <Icon className="h-5 w-5 text-white/70" />
              <span className="text-[11px] text-white/60">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Wealth tab ───────────────────────────────────────────────────────────────
// Mock static holdings for gold, silver, BTC, ETH
const STATIC_HOLDINGS = [
  { id: "gold",   label: "Gold",   ticker: "XAU", valueAed: 1240.50, change: +1.8,  color: "#f5a623" },
  { id: "silver", label: "Silver", ticker: "XAG", valueAed:  318.75, change: -0.4,  color: "#a0aec0" },
  { id: "btc",    label: "Bitcoin",ticker: "BTC", valueAed:  875.20, change: +3.2,  color: "#f7931a" },
  { id: "eth",    label: "Ethereum",ticker:"ETH", valueAed:  412.60, change: +1.1,  color: "#627eea" },
];

function WealthTab({
  positions,
  walletBalance,
  loading,
  onNavigate,
}: {
  positions: SavingsPosition[];
  walletBalance: number;
  loading: boolean;
  onNavigate: (s: string, data?: unknown) => void;
}) {
  const activePositions = positions.filter((p) => p.status === "active");
  const totalSaved = activePositions.reduce((s, p) => s + p.balance, 0);
  const totalPending = activePositions.reduce((s, p) => s + p.pendingYield, 0);
  const totalStatic = STATIC_HOLDINGS.reduce((s, h) => s + h.valueAed, 0);
  const totalWealth = parseFloat((totalSaved + totalStatic).toFixed(2));

  const productName = (id: string) =>
    id === "flexible" ? "Flexible Savings"
    : id === "30d" ? "30-Day Fixed"
    : id === "6m" ? "6-Month Fixed"
    : "1-Year Fixed";

  return (
    <div className="flex flex-col gap-5">
      {/* Total wealth card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[30px] border border-white/10 p-6"
        style={{ background: "linear-gradient(135deg,rgba(10,30,50,0.98),rgba(5,15,25,0.95))" }}
      >
        <div className="text-sm text-white/55 mb-1">Total wealth</div>
        <div className="text-4xl font-semibold tracking-tight">
          {loading ? <span className="animate-pulse text-white/30">···</span> : formatAed(totalWealth)}
        </div>
        {/* Mini breakdown bar */}
        <div className="mt-4">
          <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mb-2">
            {[
              { value: totalSaved, color: GREEN },
              ...STATIC_HOLDINGS.map((h) => ({ value: h.valueAed, color: h.color })),
            ].map(({ value, color }, i) => (
              <div
                key={i}
                className="h-full"
                style={{ width: `${(value / totalWealth) * 100}%`, background: color }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {[
              { label: "Savings", color: GREEN, value: totalSaved },
              ...STATIC_HOLDINGS.map((h) => ({ label: h.label, color: h.color, value: h.valueAed })),
            ].map(({ label, color, value }) => (
              <div key={label} className="flex items-center gap-1 text-xs text-white/50">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
                {label} {Math.round((value / totalWealth) * 100)}%
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* My Holdings */}
      <div className="rounded-[28px] bg-[#0f1117] p-5">
        <div className="mb-3 text-base font-semibold">My holdings</div>
        <div className="flex flex-col gap-2">

          {/* Savings positions */}
          {activePositions.map((pos) => {
            const earned = parseFloat((pos.balance - pos.principal).toFixed(2));
            return (
              <button
                key={pos.id}
                onClick={() => onNavigate("savingsHub")}
                className="flex items-center justify-between rounded-[16px] bg-white/5 px-4 py-3.5 text-left hover:bg-white/8 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 shrink-0" style={{ background: `${GREEN_DIM}`, color: GREEN }}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{productName(pos.productId)}</div>
                    <div className="text-xs text-white/40">Savings · +{formatAed(earned)} earned</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatAed(pos.balance)}</div>
                  <div className="text-xs" style={{ color: GREEN }}>+{pct(RATE_COLORS[pos.productId] ? [0.03,0.045,0.06,0.08][["flexible","30d","6m","1y"].indexOf(pos.productId)] : 0.03)} p.a.</div>
                </div>
              </button>
            );
          })}

          {/* Static holdings */}
          {STATIC_HOLDINGS.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-[16px] bg-white/5 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 shrink-0" style={{ background: `${h.color}18`, color: h.color }}>
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">{h.label}</div>
                  <div className="text-xs text-white/40">{h.ticker}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{formatAed(h.valueAed)}</div>
                <div className={`text-xs ${h.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {h.change >= 0 ? "+" : ""}{h.change}%
                </div>
              </div>
            </div>
          ))}

          {/* Empty savings state */}
          {!loading && activePositions.length === 0 && (
            <div className="rounded-[16px] border border-dashed border-white/10 px-4 py-4 text-center">
              <div className="text-xs text-white/35">No savings plan yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Investments entry */}
      <div className="rounded-[28px] bg-[#0f1117] p-5">
        <div className="mb-3 text-base font-semibold">Invest more</div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: TrendingUp, label: "Buy Gold" },
            { icon: TrendingUp, label: "Buy Silver" },
            { icon: PieChart, label: "Crypto" },
            { icon: MoreHorizontal, label: "More" },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="flex flex-col items-center gap-1.5 rounded-[16px] bg-white/5 py-3 hover:bg-white/8">
              <Icon className="h-5 w-5 text-white/70" />
              <span className="text-[11px] text-white/60">{label}</span>
            </button>
          ))}
        </div>

        {/* Savings entry */}
        <button
          onClick={() => onNavigate("savingsHub")}
          className="mt-3 w-full flex items-center justify-between rounded-[16px] px-4 py-3.5 transition hover:brightness-110"
          style={{ background: GREEN_DIM, border: "1px solid rgba(0,200,150,0.2)" }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2" style={{ background: "rgba(0,200,150,0.18)", color: GREEN }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold" style={{ color: GREEN }}>Savings</div>
              <div className="text-xs text-white/45">Up to 8% p.a. · Daily yield · AED</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-white/30" />
        </button>
      </div>
    </div>
  );
}

// ─── Credit tab ───────────────────────────────────────────────────────────────
function CreditTab() {
  return (
    <div className="rounded-[28px] bg-[#0f1117] p-6">
      <div className="text-2xl font-semibold mb-2">Credit</div>
      <p className="text-white/55 text-sm leading-relaxed">
        Buy now, pay later and credit products live here. Out of scope for this prototype.
      </p>
    </div>
  );
}

// ─── Screen: Money Home (Pay / Credit / Wealth tabs) ─────────────────────────
function SavingsHub({
  onNavigate,
  positions,
  walletBalance,
  loading,
  initialTab = "pay",
}: {
  onNavigate: (s: string, data?: unknown) => void;
  positions: SavingsPosition[];
  walletBalance: number;
  loading: boolean;
  initialTab?: "pay" | "credit" | "wealth";
}) {
  const [tab, setTab] = useState<"pay" | "credit" | "wealth">(initialTab);

  return (
    <div
      className={phone}
      style={{ background: "linear-gradient(180deg,#021018 0%,#03282f 22%,#000 58%)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-0">
        <div className="flex items-center gap-2">
          <span className="text-[32px] font-bold tracking-tight">botim</span>
          <span className="rounded-full bg-white px-3 py-0.5 text-xs font-bold text-black uppercase tracking-wider">
            MONEY
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
            <CreditCard className="h-5 w-5 text-white/80" />
          </div>
          <div className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_35%_35%,#d4ff8e,#457a33)] ring-2 ring-white/10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-4 pb-2">
        <TabPill active={tab === "pay"} onClick={() => setTab("pay")}>Pay</TabPill>
        <TabPill active={tab === "credit"} onClick={() => setTab("credit")}>Credit</TabPill>
        <TabPill active={tab === "wealth"} onClick={() => setTab("wealth")}>Wealth</TabPill>
      </div>

      {/* Tab content */}
      <div className="px-5 pb-28 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="pt-4"
          >
            {tab === "pay" && (
              <PayTab walletBalance={walletBalance} onNavigate={onNavigate} />
            )}
            {tab === "credit" && <CreditTab />}
            {tab === "wealth" && (
              <WealthTab
                positions={positions}
                walletBalance={walletBalance}
                loading={loading}
                onNavigate={onNavigate}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav current="money" onNavigate={(s) => onNavigate(s)} />
    </div>
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
  positions,
}: {
  onBack: () => void;
  onNavigate: (s: string, data?: unknown) => void;
  products: SavingsProduct[];
  positions: SavingsPosition[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedProduct = products.find((p) => p.id === selected);
  const hasFlexible = positions.some((p) => p.productId === "flexible" && p.status === "active");

  return (
    <PageShell onBack={onBack} title="botim" navCurrent="money">
      <div className="pt-4">
        <div className="mb-1 text-xs uppercase tracking-widest text-white/40">Step 1 of 4</div>
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
                      <div className="font-semibold text-base flex items-center gap-2">
                        {p.name}
                        {p.id === "flexible" && hasFlexible && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${color}22`, color }}>
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">
                        {p.id === "flexible" && hasFlexible ? "Funds will be added to your existing plan" : p.termLabel}
                      </div>
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
      : null;

  const canContinue = amount >= product.minDeposit;

  function handleQuick(v: number) {
    setRaw(String(v));
  }

  return (
    <PageShell onBack={onBack} title="botim" navCurrent="money">
      <div className="pt-4">
        <div className="mb-1 text-xs uppercase tracking-widest text-white/40">Step 2 of 4</div>
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
            <button onClick={() => setRaw(String(walletBalance))} className="text-[#00c896]">Use all</button>
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
          Review order
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
  const color = RATE_COLORS[product.id] ?? GREEN;
  const projected = projectedYield(amount, product.rateAnnual, product.termDays);
  const maturityDate = product.termDays
    ? new Date(Date.now() + product.termDays * 24 * 60 * 60 * 1000)
    : null;

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
        <div className="mb-1 text-xs uppercase tracking-widest text-white/40">Step 3 of 4</div>
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

        <button
          onClick={() => onNavigate("paymentMethod", { product, amount })}
          className="w-full rounded-full py-5 text-lg font-semibold transition"
          style={{ background: `linear-gradient(135deg,${GREEN},#00a87e)`, color: "#000" }}
        >
          Choose payment method
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
          onClick={() => onNavigate("hub", { tab: "wealth" })}
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
// ─── Screen: Payment Method ───────────────────────────────────────────────────
type PaymentMethod = "wallet" | "debit" | "applepay";

async function submitPosition(
  product: SavingsProduct,
  amount: number,
  paymentMethod: PaymentMethod = "wallet"
) {
  const res = await fetch("/api/savings/positions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: product.id, amount, paymentMethod }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

function PaymentMethodScreen({
  onBack,
  onNavigate,
  product,
  amount,
  walletBalance,
}: {
  onBack: () => void;
  onNavigate: (s: string, data?: unknown) => void;
  product: SavingsProduct;
  amount: number;
  walletBalance: number;
}) {
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const walletSufficient = walletBalance >= amount;

  async function handleConfirm() {
    if (!selected) return;
    if (selected === "debit") {
      onNavigate("debitCvv", { product, amount });
      return;
    }
    // wallet or apple pay — process immediately
    setLoading(true);
    setError(null);
    try {
      const data = await submitPosition(product, amount, selected);
      onNavigate("success", { position: data.position, product, amount });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const methods: {
    id: PaymentMethod;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    badge?: string;
    disabled?: boolean;
    disabledReason?: string;
  }[] = [
    {
      id: "wallet",
      label: "Botim Wallet",
      sublabel: `Balance: ${formatAed(walletBalance)}`,
      icon: <Wallet className="h-5 w-5" />,
      badge: walletSufficient ? undefined : "Insufficient",
      disabled: !walletSufficient,
      disabledReason: `You need ${formatAed(amount - walletBalance)} more`,
    },
    {
      id: "debit",
      label: "Debit card",
      sublabel: "Visa •••• 4782",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      id: "applepay",
      label: "Apple Pay",
      sublabel: "Touch ID or Face ID",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
    },
  ];

  return (
    <PageShell onBack={onBack} title="botim" navCurrent="money">
      <div className="pt-4">
        <div className="mb-1 text-xs uppercase tracking-widest text-white/40">Step 4 of 4</div>
        <div className="mb-2 text-3xl font-semibold">How would you like to pay?</div>
        <div className="mb-6 text-sm text-white/45">{formatAed(amount)} · {product.name}</div>

        <div className="flex flex-col gap-3 mb-6">
          {methods.map((m) => {
            const isSelected = selected === m.id;
            return (
              <button
                key={m.id}
                onClick={() => !m.disabled && setSelected(m.id)}
                disabled={m.disabled}
                className="w-full rounded-[22px] border p-5 text-left transition"
                style={{
                  borderColor: isSelected ? GREEN : "rgba(255,255,255,0.08)",
                  background: isSelected ? `${GREEN_DIM}` : "#0f1117",
                  opacity: m.disabled ? 0.45 : 1,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="rounded-full p-2.5"
                      style={{
                        background: isSelected ? `rgba(0,200,150,0.18)` : "rgba(255,255,255,0.07)",
                        color: isSelected ? GREEN : "rgba(255,255,255,0.7)",
                      }}
                    >
                      {m.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-2">
                        {m.label}
                        {m.badge && (
                          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">
                        {m.disabled ? m.disabledReason : m.sublabel}
                      </div>
                    </div>
                  </div>
                  {/* Radio circle */}
                  <div
                    className="h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: isSelected ? GREEN : "rgba(255,255,255,0.2)" }}
                  >
                    {isSelected && (
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: GREEN }} />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          disabled={!selected || loading}
          onClick={handleConfirm}
          className="w-full rounded-full py-5 text-lg font-semibold transition disabled:opacity-30"
          style={{
            background: selected ? `linear-gradient(135deg,${GREEN},#00a87e)` : "#1a1a1a",
            color: selected ? "#000" : "#fff",
          }}
        >
          {loading ? "Processing…" : selected === "applepay" ? "Pay with Apple Pay" : selected === "debit" ? "Enter CVV" : "Confirm & Start saving"}
        </button>
      </div>
    </PageShell>
  );
}

// ─── Screen: Debit CVV ────────────────────────────────────────────────────────
function DebitCvvScreen({
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
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = cvv.length === 3;

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const data = await submitPosition(product, amount, "debit");
      onNavigate("success", { position: data.position, product, amount });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell onBack={onBack} title="botim" navCurrent="money">
      <div className="pt-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-white/8 p-3">
            <CreditCard className="h-6 w-6 text-white/70" />
          </div>
          <div>
            <div className="text-xl font-semibold">Visa •••• 4782</div>
            <div className="text-sm text-white/45">Confirm payment of {formatAed(amount)}</div>
          </div>
        </div>

        <div className="mb-6 rounded-[28px] bg-[#0f1117] p-6">
          <div className="mb-2 text-xs text-white/45 uppercase tracking-wider">CVV</div>
          <input
            type="password"
            inputMode="numeric"
            maxLength={3}
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
            placeholder="•••"
            className="w-full bg-transparent text-4xl font-semibold tracking-[0.5em] outline-none placeholder-white/15 text-white"
          />
          <div className="mt-3 text-xs text-white/35">3-digit code on the back of your card</div>
        </div>

        {/* Card visual hint */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-52 h-32 rounded-[20px] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/10 p-4 flex flex-col justify-between">
            <div className="text-xs text-white/40 font-mono">VISA •••• 4782</div>
            <div className="self-end flex flex-col items-end">
              <div className="text-[10px] text-white/35 mb-0.5">CVV</div>
              <div
                className="rounded-md border px-3 py-1 text-xs font-mono"
                style={{ borderColor: valid ? GREEN : "rgba(255,255,255,0.2)", color: valid ? GREEN : "rgba(255,255,255,0.4)" }}
              >
                {cvv.length > 0 ? "•".repeat(cvv.length) : "•••"}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          disabled={!valid || loading}
          onClick={handlePay}
          className="w-full rounded-full py-5 text-lg font-semibold transition disabled:opacity-30"
          style={{
            background: valid ? `linear-gradient(135deg,${GREEN},#00a87e)` : "#1a1a1a",
            color: valid ? "#000" : "#fff",
          }}
        >
          {loading ? "Processing…" : "Pay & Start saving"}
        </button>
      </div>
    </PageShell>
  );
}

// ─── Screen: Savings Hub (entry from Wealth → Savings) ───────────────────────
function SavingsHubScreen({
  onBack,
  onNavigate,
  positions,
  walletBalance,
  loading,
}: {
  onBack: () => void;
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
      onBack={onBack}
      title="botim"
      subtitle="SAVINGS"
      navCurrent="money"
      onNavigate={(s) => onNavigate(s)}
      gradient="linear-gradient(180deg,#001a12 0%,#002b1e 22%,#000 65%)"
    >
      <div className="pt-4 flex flex-col gap-5">
        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-white/10 p-6"
          style={{ background: "linear-gradient(135deg,rgba(0,60,42,0.95),rgba(0,28,20,0.92))" }}
        >
          <div className="text-sm text-white/60 mb-1">Total savings balance</div>
          <div className="text-4xl font-semibold tracking-tight">
            {loading ? <span className="animate-pulse text-white/30">···</span> : formatAed(totalSaved)}
          </div>
          {totalSaved > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: GREEN_DIM, color: GREEN }}>
                +{formatAed(totalPending)} pending today
              </span>
              <span className="text-xs text-white/40">credited T+1</span>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/8 px-4 py-3">
            <span className="text-sm text-white/60">Wallet balance</span>
            <span className="text-base font-semibold">{formatAed(walletBalance)}</span>
          </div>
        </motion.div>

        {/* Open new plan CTA */}
        <button
          onClick={() => onNavigate("selectProduct")}
          className="flex w-full items-center justify-between rounded-[24px] px-6 py-5 text-left font-semibold text-lg transition hover:scale-[1.01]"
          style={{ background: `linear-gradient(135deg,${GREEN},#00a87e)`, color: "#000" }}
        >
          <span>Open new savings plan</span>
          <Plus className="h-6 w-6" />
        </button>

        {/* Active plans */}
        {activePositions.length > 0 && (
          <div>
            <div className="mb-3 text-base font-semibold text-white/80">My plans</div>
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
          <div className="rounded-[24px] bg-[#0f1117] p-6 text-center">
            <div className="mb-2 text-4xl">🌱</div>
            <div className="text-base font-semibold">Start growing your money</div>
            <div className="mt-1 text-sm text-white/45">
              Earn up to 8% p.a. — powered by stablecoin yield, paid daily in AED.
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="rounded-[28px] bg-[#0f1117] p-5">
          <div className="mb-3 text-base font-semibold">How it works</div>
          <div className="flex flex-col gap-3">
            {[
              { icon: <TrendingUp className="h-4 w-4" />, text: "Deposit AED — earn yield in AED" },
              { icon: <Sparkles className="h-4 w-4" />, text: "Yield accrues daily, credited T+1" },
              { icon: <ShieldCheck className="h-4 w-4" />, text: "Powered by stablecoin staking — you hold AED" },
              { icon: <BadgeCheck className="h-4 w-4" />, text: "Yield auto-reinvested for compounding" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-white/75">
                <div className="rounded-full p-1.5 shrink-0" style={{ background: GREEN_DIM, color: GREEN }}>{icon}</div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

type Screen =
  | "hub"
  | "savingsHub"
  | "selectProduct"
  | "deposit"
  | "confirm"
  | "paymentMethod"
  | "debitCvv"
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
      setHistory([{ screen: "hub", data }]);
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
            initialTab={(data as { tab?: "pay" | "credit" | "wealth" })?.tab ?? "pay"}
          />
        );
      case "savingsHub":
        return (
          <SavingsHubScreen
            onBack={() => navigate("hub", { tab: "wealth" })}
            onNavigate={navigate}
            positions={positions}
            walletBalance={walletBalance}
            loading={loading}
          />
        );
      case "selectProduct":
        return (
          <ProductSelector onBack={back} onNavigate={navigate} products={products} positions={positions} />
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
            onNavigate={navigate}
            product={product}
            amount={amount}
          />
        );
      }
      case "paymentMethod": {
        const { product, amount } = data as { product: SavingsProduct; amount: number };
        return (
          <PaymentMethodScreen
            onBack={back}
            onNavigate={(s, d) => {
              navigate(s, d);
              if (s === "success") loadData();
            }}
            product={product}
            amount={amount}
            walletBalance={walletBalance}
          />
        );
      }
      case "debitCvv": {
        const { product, amount } = data as { product: SavingsProduct; amount: number };
        return (
          <DebitCvvScreen
            onBack={back}
            onNavigate={(s, d) => {
              navigate(s, d);
              if (s === "success") loadData();
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
