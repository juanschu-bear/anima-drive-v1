import { serviceClient } from "./_supabase.js";

type ServiceClient = ReturnType<typeof serviceClient>;

type SignalSeverity = "low" | "medium" | "high" | "critical";

interface DraftSignal {
  signal_key: string;
  severity: SignalSeverity;
  score: number;
  title: string;
  details: string;
  payload: Record<string, unknown>;
}

interface RecommendationDraft {
  signal_key: string;
  priority: number;
  title: string;
  rationale: string;
  action: string;
  due_date?: string | null;
  metadata?: Record<string, unknown>;
}

interface ToneAnalysis {
  stress_score: number;
  confidence_score: number;
  urgency_score: number;
  sentiment: "positive" | "neutral" | "negative";
}

interface FinanceDocLite {
  id: string;
  filename: string;
  category_key: string | null;
  extracted_at: string | null;
}

interface ExtractionLite {
  document_id: string;
  document_type: string | null;
  vendor: string | null;
  doc_date: string | null;
  due_date: string | null;
  total_amount: number | null;
  currency: string | null;
}

interface AskEventLite {
  payload: { tone?: ToneAnalysis };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function analyzeToneForCfo(message: string): ToneAnalysis {
  const text = message.toLowerCase();
  const stressTerms = [
    "stress",
    "stressed",
    "anxious",
    "panic",
    "angst",
    "sorge",
    "sorgen",
    "nervös",
    "deuda",
    "deudas",
    "miedo",
    "urgent",
    "dringend",
    "urgente",
  ];
  const confidenceTerms = [
    "plan",
    "done",
    "clear",
    "ready",
    "solved",
    "klar",
    "gelöst",
    "listo",
    "resuelto",
    "confident",
  ];
  const urgencyTerms = ["now", "asap", "today", "heute", "ahora", "hoy", "urgent", "dringend"];

  const stressHits = stressTerms.filter((w) => text.includes(w)).length;
  const confidenceHits = confidenceTerms.filter((w) => text.includes(w)).length;
  const urgencyHits = urgencyTerms.filter((w) => text.includes(w)).length;
  const exclamationCount = (message.match(/!/g) ?? []).length;

  const stress = clamp(stressHits * 18 + exclamationCount * 6, 0, 100);
  const confidence = clamp(confidenceHits * 20 - stressHits * 5, 0, 100);
  const urgency = clamp(urgencyHits * 25 + exclamationCount * 8, 0, 100);
  const sentiment: ToneAnalysis["sentiment"] =
    stress >= 55 ? "negative" : confidence >= 40 ? "positive" : "neutral";

  return {
    stress_score: round2(stress),
    confidence_score: round2(confidence),
    urgency_score: round2(urgency),
    sentiment,
  };
}

export async function emitCfoEvent(
  svc: ServiceClient,
  input: {
    userId: string;
    eventType: string;
    source: string;
    payload?: Record<string, unknown>;
    documentId?: string | null;
    conversationId?: string | null;
  },
): Promise<void> {
  await svc.from("ad_cfo_events").insert({
    user_id: input.userId,
    event_type: input.eventType,
    source: input.source,
    payload: input.payload ?? {},
    document_id: input.documentId ?? null,
    conversation_id: input.conversationId ?? null,
  });
}

export async function recomputeCfoProfile(svc: ServiceClient, userId: string): Promise<void> {
  const [docsRes, exRes, askEventsRes, pendingRecRes] = await Promise.all([
    svc
      .from("ad_documents")
      .select("id, filename, category_key, extracted_at")
      .eq("user_id", userId)
      .eq("status", "ready"),
    svc
      .from("ad_extractions")
      .select(
        "document_id, document_type, vendor, doc_date, due_date, total_amount, currency, created_at, ad_documents!inner(user_id)",
      )
      .eq("ad_documents.user_id", userId),
    svc
      .from("ad_cfo_events")
      .select("payload")
      .eq("user_id", userId)
      .eq("event_type", "ask_user_message")
      .order("created_at", { ascending: false })
      .limit(25),
    svc.from("ad_cfo_recommendations").select("title").eq("user_id", userId).eq("status", "pending"),
  ]);

  const docs = ((docsRes.data ?? []) as FinanceDocLite[]).filter(Boolean);
  const extractionRows = ((exRes.data ?? []) as (ExtractionLite & { created_at?: string })[]).map(
    ({ document_id, document_type, vendor, doc_date, due_date, total_amount, currency }) => ({
      document_id,
      document_type,
      vendor,
      doc_date,
      due_date,
      total_amount,
      currency,
    }),
  );
  const askEvents = (askEventsRes.data ?? []) as AskEventLite[];

  const now = Date.now();
  const cutoff30 = now - 30 * DAY_MS;
  const cutoff60 = now - 60 * DAY_MS;

  let totalSpend30d = 0;
  let totalSpendPrev30d = 0;
  let openDue14dCount = 0;
  let openDue14dAmount = 0;
  let activeFinancialDocs = 0;
  let activeContractDocs = 0;
  let missingFinancialFields = 0;
  const vendorSpend = new Map<string, number>();

  for (const e of extractionRows) {
    const isFinancial = e.document_type === "financial";
    const isContract = e.document_type === "contract" || e.document_type === "legal";
    if (isFinancial) activeFinancialDocs += 1;
    if (isContract) activeContractDocs += 1;

    if (isFinancial && (!e.vendor || e.total_amount == null)) {
      missingFinancialFields += 1;
    }

    if (e.total_amount != null && Number.isFinite(Number(e.total_amount))) {
      const amount = Number(e.total_amount);
      const dateMs = dateToMs(e.doc_date);
      if (dateMs !== null) {
        if (dateMs >= cutoff30 && dateMs <= now) totalSpend30d += amount;
        if (dateMs >= cutoff60 && dateMs < cutoff30) totalSpendPrev30d += amount;
      }

      if (e.vendor) {
        vendorSpend.set(e.vendor, (vendorSpend.get(e.vendor) ?? 0) + amount);
      }
    }

    const dueMs = dateToMs(e.due_date);
    if (dueMs !== null && dueMs >= now && dueMs <= now + 14 * DAY_MS) {
      openDue14dCount += 1;
      openDue14dAmount += Number(e.total_amount ?? 0);
    }
  }

  let topVendor: string | null = null;
  let topVendorShare: number | null = null;
  let topVendorAmount = 0;
  for (const [vendor, amount] of vendorSpend.entries()) {
    if (amount > topVendorAmount) {
      topVendorAmount = amount;
      topVendor = vendor;
    }
  }
  const totalVendorSpend = [...vendorSpend.values()].reduce((a, b) => a + b, 0);
  if (topVendor && totalVendorSpend > 0) {
    topVendorShare = topVendorAmount / totalVendorSpend;
  }

  const behaviorStressScore = computeBehaviorStressScore(askEvents);
  const growthRatio =
    totalSpendPrev30d > 0 ? (totalSpend30d - totalSpendPrev30d) / totalSpendPrev30d : 0;

  const signals: DraftSignal[] = [];
  if (totalSpend30d > 0 && totalSpendPrev30d > 0 && growthRatio >= 0.35) {
    signals.push({
      signal_key: "spend_velocity_spike",
      severity: growthRatio >= 0.75 ? "critical" : "high",
      score: round2(Math.min(100, growthRatio * 100)),
      title: "Spending velocity increased sharply",
      details: `Last 30d spending rose by ${Math.round(growthRatio * 100)}% vs previous 30d.`,
      payload: { totalSpend30d, totalSpendPrev30d, growthRatio: round2(growthRatio) },
    });
  }
  if (openDue14dAmount >= 1000 || openDue14dCount >= 3) {
    signals.push({
      signal_key: "upcoming_due_pressure",
      severity: openDue14dAmount >= 3000 ? "high" : "medium",
      score: round2(Math.min(100, openDue14dAmount / 40)),
      title: "Upcoming due payment pressure",
      details: `${openDue14dCount} due item(s) in the next 14 days totaling ${round2(
        openDue14dAmount,
      )}.`,
      payload: { openDue14dCount, openDue14dAmount: round2(openDue14dAmount) },
    });
  }
  if (topVendorShare != null && topVendorShare >= 0.4 && totalVendorSpend >= 1000) {
    signals.push({
      signal_key: "vendor_concentration_risk",
      severity: topVendorShare >= 0.6 ? "high" : "medium",
      score: round2(topVendorShare * 100),
      title: "Vendor concentration risk",
      details: `Top vendor ${topVendor} represents ${Math.round(topVendorShare * 100)}% of tracked spend.`,
      payload: { topVendor, topVendorShare: round2(topVendorShare), totalVendorSpend: round2(totalVendorSpend) },
    });
  }
  if (behaviorStressScore >= 50) {
    signals.push({
      signal_key: "communication_stress_signal",
      severity: behaviorStressScore >= 75 ? "high" : "medium",
      score: round2(behaviorStressScore),
      title: "Stress signal in communication",
      details: "Recent user language indicates elevated urgency/stress related to finances.",
      payload: { behaviorStressScore },
    });
  }
  if (missingFinancialFields >= 2) {
    signals.push({
      signal_key: "data_quality_gap",
      severity: "low",
      score: round2(Math.min(100, missingFinancialFields * 20)),
      title: "Data quality gap in financial docs",
      details: `${missingFinancialFields} financial docs are missing critical extraction fields.`,
      payload: { missingFinancialFields },
    });
  }

  const riskScore =
    signals.reduce((acc, s) => acc + severityWeight(s.severity), 0) + behaviorStressScore * 0.15;
  const healthScore = clamp(100 - riskScore, 5, 98);
  const riskLevel = healthScore >= 75 ? "low" : healthScore >= 45 ? "medium" : "high";

  const profileJson = {
    generated_at: new Date().toISOString(),
    metrics: {
      total_spend_30d: round2(totalSpend30d),
      total_spend_prev_30d: round2(totalSpendPrev30d),
      growth_ratio: round2(growthRatio),
      open_due_14d_count: openDue14dCount,
      open_due_14d_amount: round2(openDue14dAmount),
      active_financial_docs: activeFinancialDocs,
      active_contract_docs: activeContractDocs,
      behavior_stress_score: round2(behaviorStressScore),
      top_vendor: topVendor,
      top_vendor_share: topVendorShare != null ? round2(topVendorShare) : null,
    },
    signals: signals.map((s) => ({
      signal_key: s.signal_key,
      severity: s.severity,
      score: s.score,
      title: s.title,
    })),
  };

  await svc.from("ad_cfo_profiles").upsert({
    user_id: userId,
    health_score: round2(healthScore),
    risk_level: riskLevel,
    total_spend_30d: round2(totalSpend30d),
    total_spend_prev_30d: round2(totalSpendPrev30d),
    active_financial_docs: activeFinancialDocs,
    active_contract_docs: activeContractDocs,
    open_due_14d_count: openDue14dCount,
    open_due_14d_amount: round2(openDue14dAmount),
    top_vendor: topVendor,
    top_vendor_share: topVendorShare != null ? round2(topVendorShare) : null,
    behavior_stress_score: round2(behaviorStressScore),
    profile_json: profileJson,
    last_recomputed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await svc
    .from("ad_cfo_signals")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "active");

  const signalRows = signals.map((s) => ({
    user_id: userId,
    signal_key: s.signal_key,
    severity: s.severity,
    score: s.score,
    title: s.title,
    details: s.details,
    payload: s.payload,
    status: "active",
  }));
  let insertedSignals: Array<{ id: string; signal_key: string }> = [];
  if (signalRows.length > 0) {
    const { data } = await svc
      .from("ad_cfo_signals")
      .insert(signalRows)
      .select("id, signal_key");
    insertedSignals = (data ?? []) as Array<{ id: string; signal_key: string }>;
  }
  const signalIdByKey = new Map(insertedSignals.map((s) => [s.signal_key, s.id]));

  const recs = buildRecommendations(signals, {
    totalSpend30d: round2(totalSpend30d),
    openDue14dAmount: round2(openDue14dAmount),
  });
  const pendingTitles = new Set(((pendingRecRes.data ?? []) as Array<{ title: string }>).map((r) => r.title));
  const recRows = recs
    .filter((r) => !pendingTitles.has(r.title))
    .map((r) => ({
      user_id: userId,
      signal_id: signalIdByKey.get(r.signal_key) ?? null,
      priority: r.priority,
      title: r.title,
      rationale: r.rationale,
      action: r.action,
      due_date: r.due_date ?? null,
      metadata: r.metadata ?? {},
    }));
  if (recRows.length > 0) {
    await svc.from("ad_cfo_recommendations").insert(recRows);
  }
}

function computeBehaviorStressScore(events: AskEventLite[]): number {
  if (!events.length) return 0;
  const scores = events
    .map((e) => e.payload?.tone?.stress_score)
    .filter((v): v is number => typeof v === "number");
  if (!scores.length) return 0;
  return round2(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function buildRecommendations(
  signals: DraftSignal[],
  context: { totalSpend30d: number; openDue14dAmount: number },
): RecommendationDraft[] {
  const recs: RecommendationDraft[] = [];
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * DAY_MS).toISOString().slice(0, 10);
  const in14 = new Date(now.getTime() + 14 * DAY_MS).toISOString().slice(0, 10);

  for (const s of signals) {
    if (s.signal_key === "spend_velocity_spike") {
      recs.push({
        signal_key: s.signal_key,
        priority: 1,
        title: "Start a 7-day spending freeze review",
        rationale: `Spending acceleration detected with 30-day spend at ${context.totalSpend30d}.`,
        action: "Pause non-essential spend for 7 days and tag each new expense as must-have or optional.",
        due_date: in7,
      });
    } else if (s.signal_key === "upcoming_due_pressure") {
      recs.push({
        signal_key: s.signal_key,
        priority: 1,
        title: "Build a due-date payment plan",
        rationale: `Upcoming due amount (${context.openDue14dAmount}) may create near-term cash pressure.`,
        action: "Prioritize due invoices by date and amount, then schedule payments to avoid late fees.",
        due_date: in7,
      });
    } else if (s.signal_key === "vendor_concentration_risk") {
      recs.push({
        signal_key: s.signal_key,
        priority: 2,
        title: "Reduce single-vendor concentration",
        rationale: "One vendor dominates your spend profile, increasing dependency risk.",
        action: "Review alternatives and renegotiate terms with your top vendor this week.",
        due_date: in14,
      });
    } else if (s.signal_key === "communication_stress_signal") {
      recs.push({
        signal_key: s.signal_key,
        priority: 2,
        title: "Switch CFO mode to low-friction actions",
        rationale: "Communication stress is elevated; fewer actions improve consistency.",
        action: "Use 1 daily financial action max until stress signal stabilizes.",
      });
    } else if (s.signal_key === "data_quality_gap") {
      recs.push({
        signal_key: s.signal_key,
        priority: 3,
        title: "Improve extraction coverage",
        rationale: "Missing key fields reduces recommendation quality.",
        action: "Re-upload blurry docs and prioritize invoices with missing vendor/total.",
      });
    }
  }
  return recs;
}

function dateToMs(value: string | null): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function severityWeight(severity: SignalSeverity): number {
  if (severity === "critical") return 34;
  if (severity === "high") return 24;
  if (severity === "medium") return 14;
  return 7;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

