"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapClaim, mapPayment, mapPolicy, mapProduct, mapQuote } from "@/lib/supabase/mappers";
import { products as seedProducts, participants as seedParticipants } from "@/lib/seed";
import { platformStore, usePlatform } from "@/lib/store";
import type { Claim, Payment, Policy, Product, Quote } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sb(): any {
  return createClient();
}

export function useBackendMode() {
  return isSupabaseConfigured() ? ("supabase" as const) : ("demo" as const);
}

export function useProducts() {
  const mode = useBackendMode();
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [loading, setLoading] = useState(mode === "supabase");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "supabase") {
      setProducts(seedProducts);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error: err } = await sb().from("products").select("*").eq("is_active", true).order("name");
        if (err) throw err;
        if (!cancelled) setProducts((data ?? []).map((row: unknown) => mapProduct(row as never)));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load products");
          setProducts(seedProducts);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return { products, loading, error, mode };
}

export function useQuotesBook() {
  const mode = useBackendMode();
  const demo = usePlatform();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(mode === "supabase");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (mode !== "supabase") {
      setQuotes(demo.quotes);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error: err } = await sb()
          .from("quotes")
          .select("*, participants(full_name), products(name)")
          .order("created_at", { ascending: false });
        if (err) throw err;
        if (!cancelled) {
          setQuotes(
            (data ?? []).map((row: Record<string, unknown>) =>
              mapQuote(row as never, {
                participantName: (row.participants as { full_name?: string } | null)?.full_name,
                productName: (row.products as { name?: string } | null)?.name,
              }),
            ),
          );
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load quotes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, demo.quotes, tick]);

  return { quotes, loading, error, mode, refresh };
}

export function usePoliciesBook() {
  const mode = useBackendMode();
  const demo = usePlatform();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(mode === "supabase");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (mode !== "supabase") {
      setPolicies(demo.policies);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error: err } = await sb()
          .from("policies")
          .select("*, participants(full_name), products(name), agents(full_name), branches(name)")
          .order("created_at", { ascending: false });
        if (err) throw err;
        if (!cancelled) {
          setPolicies(
            (data ?? []).map((row: Record<string, unknown>) =>
              mapPolicy(row as never, {
                participantName: (row.participants as { full_name?: string } | null)?.full_name,
                productName: (row.products as { name?: string } | null)?.name,
                agentName: (row.agents as { full_name?: string } | null)?.full_name ?? undefined,
                branch: (row.branches as { name?: string } | null)?.name ?? undefined,
              }),
            ),
          );
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load policies");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, demo.policies, tick]);

  return { policies, loading, error, mode, refresh };
}

export function useClaimsBook() {
  const mode = useBackendMode();
  const demo = usePlatform();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(mode === "supabase");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (mode !== "supabase") {
      setClaims(demo.claims);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error: err } = await sb()
          .from("claims")
          .select("*, participants(full_name), policies(policy_number)")
          .order("created_at", { ascending: false });
        if (err) throw err;
        if (!cancelled) {
          setClaims(
            (data ?? []).map((row: Record<string, unknown>) =>
              mapClaim(row as never, {
                participantName: (row.participants as { full_name?: string } | null)?.full_name,
                policyNumber: (row.policies as { policy_number?: string } | null)?.policy_number,
              }),
            ),
          );
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load claims");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, demo.claims, tick]);

  return { claims, loading, error, mode, refresh };
}

export function usePaymentsBook() {
  const mode = useBackendMode();
  const demo = usePlatform();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(mode === "supabase");
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (mode !== "supabase") {
      setPayments(demo.payments);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await sb()
          .from("payments")
          .select("*, participants(full_name), policies(policy_number)")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (!cancelled) {
          setPayments(
            (data ?? []).map((row: Record<string, unknown>) =>
              mapPayment(row as never, {
                participantName: (row.participants as { full_name?: string } | null)?.full_name,
                policyNumber: (row.policies as { policy_number?: string } | null)?.policy_number,
              }),
            ),
          );
        }
      } catch {
        // keep empty on failure
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, demo.payments, tick]);

  return { payments, loading, mode, refresh };
}

export async function persistQuote(quote: Quote, operatorId: string) {
  if (!isSupabaseConfigured()) {
    platformStore.addQuote(quote);
    return quote;
  }
  const { data, error } = await sb()
    .from("quotes")
    .insert({
      id: quote.id,
      operator_id: operatorId,
      quote_number: quote.number,
      participant_id: quote.participantId || null,
      agent_id: quote.agentId || null,
      product_id: quote.productId,
      channel: quote.channel,
      status: quote.status,
      risk_payload: quote.risk,
      sum_covered: quote.sumCovered,
      base_contribution: quote.base,
      wakala_fee: quote.wakala,
      tabarru: quote.tabarru,
      taxes: quote.taxes,
      levies: quote.levies,
      total_contribution: quote.total,
      frequency: quote.frequency,
      monthly_equivalent: quote.monthly,
      uw_decision: quote.uwDecision,
      uw_notes: quote.uwNotes,
      valid_until: quote.validUntil || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapQuote(data as never, { participantName: quote.participantName, productName: quote.productName });
}

export async function persistPolicy(policy: Policy, operatorId: string) {
  if (!isSupabaseConfigured()) {
    platformStore.addPolicy(policy);
    return policy;
  }
  const { data, error } = await sb()
    .from("policies")
    .insert({
      id: policy.id,
      operator_id: operatorId,
      policy_number: policy.number,
      participant_id: policy.participantId,
      product_id: policy.productId,
      agent_id: policy.agentId || null,
      status: policy.status,
      channel: policy.channel,
      inception_date: policy.inception,
      expiry_date: policy.expiry,
      sum_covered: policy.sumCovered,
      contribution: policy.contribution,
      frequency: policy.frequency,
      wakala_fee: policy.wakala,
      tabarru: policy.tabarru,
      risk_payload: {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapPolicy(data as never, {
    participantName: policy.participantName,
    productName: policy.productName,
    agentName: policy.agentName,
    branch: policy.branch,
  });
}

export async function persistClaim(claim: Claim, operatorId: string) {
  if (!isSupabaseConfigured()) {
    platformStore.addClaim(claim);
    return claim;
  }
  const { data, error } = await sb()
    .from("claims")
    .insert({
      id: claim.id,
      operator_id: operatorId,
      claim_number: claim.number,
      policy_id: claim.policyId,
      participant_id: claim.participantId,
      status: claim.status,
      incident_date: claim.incidentDate,
      description: claim.description,
      incident_location: claim.location,
      claimed_amount: claim.claimed,
      fraud_score: claim.fraudScore,
      sla_due_at: claim.slaDue || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapClaim(data as never, {
    participantName: claim.participantName,
    policyNumber: claim.policyNumber,
  });
}

export async function updateQuoteRemote(id: string, patch: Partial<Quote>) {
  if (!isSupabaseConfigured()) {
    platformStore.updateQuote(id, patch);
    return;
  }
  const payload: Record<string, unknown> = {};
  if (patch.status) payload.status = patch.status;
  if (patch.uwDecision) payload.uw_decision = patch.uwDecision;
  if (patch.uwNotes) payload.uw_notes = patch.uwNotes;
  const { error } = await sb().from("quotes").update(payload).eq("id", id);
  if (error) throw error;
}

export async function updatePolicyRemote(id: string, patch: Partial<Policy>) {
  if (!isSupabaseConfigured()) {
    platformStore.updatePolicy(id, patch);
    return;
  }
  const payload: Record<string, unknown> = {};
  if (patch.status) payload.status = patch.status;
  const { error } = await sb().from("policies").update(payload).eq("id", id);
  if (error) throw error;
}

export async function updateClaimRemote(id: string, patch: Partial<Claim>) {
  if (!isSupabaseConfigured()) {
    platformStore.updateClaim(id, patch);
    return;
  }
  const payload: Record<string, unknown> = {};
  if (patch.status) payload.status = patch.status;
  if (patch.approved != null) payload.approved_amount = patch.approved;
  const { error } = await sb().from("claims").update(payload).eq("id", id);
  if (error) throw error;
}

export { seedParticipants };
