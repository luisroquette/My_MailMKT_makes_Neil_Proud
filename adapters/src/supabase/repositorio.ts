import type {
  FilaOutbox,
  LeadNurture,
  RepositorioDeNurture,
  ReservaLog,
} from "@mymailmkt/nucleo";

/**
 * Supabase adapter — faithful to the CF Gauss reference:
 *
 * - `lerLeads` is paginated via range() — PostgREST silently truncates raw
 *   selects at 1000 rows, so `.select()` without range is forbidden;
 * - `reservarNoLog` maps unique violation 23505 to "duplicado" (already
 *   sent — caller skips, never retries);
 * - the outbox goes through the 4 atomic RPCs (reserve/claim/complete/
 *   release); a refused reservation (already present) returns false.
 *
 * The client is injected, so the adapter has no secrets and no network of
 * its own — and can be tested with a mock.
 */

export interface ClienteSupabase {
  from(tabela: string): {
    select(colunas?: string): {
      range(inicio: number, fim: number): Promise<{ data: unknown[] | null; error: { code?: string; message: string } | null }>;
      gte(coluna: string, valor: string): { range(inicio: number, fim: number): Promise<{ data: unknown[] | null; error: { code?: string; message: string } | null }> };
    };
    insert(linha: unknown): {
      select(colunas: string): { single(): Promise<{ data: unknown | null; error: { code?: string; message: string } | null }> };
      then<T>(onfulfilled?: (v: { data: unknown | null; error: { code?: string; message: string } | null }) => T): Promise<T>;
    };
  };
  rpc(
    nome: string,
    args: Record<string, unknown>,
  ): Promise<{ data?: unknown; error: { message: string } | null }>;
}

export function criarAdapterSupabase(client: ClienteSupabase): {
  repo: RepositorioDeNurture;
  fila: FilaOutbox;
} {
  const repo: RepositorioDeNurture = {
    async lerLeads({ offset, limite }) {
      const q = client.from("nurture_leads").select("*");
      const { data, error } = await q.range(offset, offset + limite - 1);
      if (error || !data) return { itens: [], temMais: false, offset };
      const itens = data as LeadNurture[];
      return { itens, temMais: itens.length === limite, offset };
    },

    async lerSupressoes() {
      const { data, error } = await client.from("nurture_suppressions").select("email").range(0, 999);
      if (error || !data) return new Set<string>();
      return new Set((data as { email: string }[]).map((l) => l.email.toLowerCase()));
    },

    async lerLogDeEnvio({ desde }) {
      const { data, error } = await client
        .from("nurture_email_log")
        .select("*")
        .gte("sent_at", desde)
        .range(0, 9999);
      if (error || !data) return [];
      return (data as { to_email: string; email_type: string; sent_at: string }[]).map((l) => ({
        email: l.to_email,
        emailType: l.email_type,
        sentAt: l.sent_at,
      }));
    },

    async reservarNoLog(r: ReservaLog) {
      const resultado = await client.from("nurture_email_log").insert({
        lead_id: r.leadId,
        to_email: r.email,
        email_type: r.emailType,
        sent_at: r.sentAt,
      }).select("id").single();
      if (resultado.error?.code === "23505") return "duplicado";
      if (resultado.error) return "erro";
      return "ok";
    },
  };

  const fila: FilaOutbox = {
    async reservar(e) {
      // The RPC returns the INSERT "found" boolean: false = key already
      // exists (never resend). Discarding it would send duplicates.
      const { data, error } = await client.rpc("reserve_nurture_email_outbox", {
        p_idempotency_key: e.idempotencyKey,
        p_email_args: e,
        p_source: "nurture",
        p_source_ids: [],
      });
      if (error) return false;
      return data !== false;
    },
    async reivindicar(idempotencyKey) {
      const { data, error } = await client.rpc("claim_nurture_email_outbox", {
        p_idempotency_key: idempotencyKey,
      });
      if (error || !data) return null;
      return data as unknown as import("@mymailmkt/nucleo").EmailParaEnviar;
    },
    async concluir(idempotencyKey) {
      await client.rpc("complete_nurture_email_outbox", {
        p_idempotency_key: idempotencyKey,
        p_resend_id: null,
      });
    },
    async liberar(idempotencyKey) {
      await client.rpc("release_nurture_email_outbox", {
        p_idempotency_key: idempotencyKey,
        p_last_error: "falha definitiva — liberado para retry",
      });
    },
    async listarPendentes() {
      const { data, error } = await client.rpc("list_nurture_email_outbox_pending", {});
      if (error || !Array.isArray(data)) return [];
      return (data as {
        idempotency_key: string;
        email_args: unknown;
        created_at: string;
        last_attempt_at: string | null;
      }[]).map((l) => ({
        idempotencyKey: l.idempotency_key,
        email: l.email_args as unknown as import("@mymailmkt/nucleo").EmailParaEnviar,
        criadoEm: l.created_at,
        ultimaTentativaEm: l.last_attempt_at,
      }));
    },
    async removerOrfas(maisVelhasQue) {
      const { data } = await client.rpc("remove_nurture_email_outbox_orfas", {
        p_older_than: maisVelhasQue,
      });
      return typeof data === "number" ? data : 0;
    },
  };

  return { repo, fila };
}
