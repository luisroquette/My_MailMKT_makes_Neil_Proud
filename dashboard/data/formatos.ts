/** PT-BR display helpers — raw ISO strings never reach the UI. */
export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()} ${hora}:${min}`;
}

export function formatarDia(isoDia: string): string {
  const [a, m, d] = isoDia.split("-");
  return `${d}/${m}/${a}`;
}
