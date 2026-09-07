const UNIT_SECONDS: Record<string, number> = {
  h: 3600,
  hora: 3600,
  horas: 3600,
  min: 60,
  minuto: 60,
  minutos: 60,
  seg: 1,
  segundo: 1,
  segundos: 1,
};

/** Abaixo disso você fica de olho na panela; não vale um cronômetro. */
const MIN_TIMER_SECONDS = 60;
/** Acima disso é descanso / marinada / geladeira — o app não fica aberto tanto tempo. */
const MAX_TIMER_SECONDS = 120 * 60;

function unitToSeconds(n: number, unit: string): number {
  return n * (UNIT_SECONDS[unit.toLowerCase()] ?? 0);
}

/**
 * Extrai do texto de um passo a maior duração que vale um cronômetro de verdade
 * (ex.: "asse por 12 minutos", "cozinhe de 40 a 45 minutos"). Ignora tempos
 * curtos demais (< 1 min) e longos demais (> 2 h). Em faixas, usa o limite maior.
 * Retorna segundos, ou null quando não há nada cronometrável.
 */
export function parseStepDuration(text: string): number | null {
  const t = text.toLowerCase();
  const candidates: number[] = [];
  const consumed: [number, number][] = [];

  // faixas: "3 a 4 minutos", "12 a 15 segundos", "6-8 horas"
  const rangeRe = /(\d+)\s*(?:a|até|-)\s*(\d+)\s*(horas?|minutos?|min|segundos?|seg)\b/g;
  for (const m of t.matchAll(rangeRe)) {
    candidates.push(unitToSeconds(Number(m[2]), m[3]));
    const start = m.index ?? 0;
    consumed.push([start, start + m[0].length]);
  }

  // valores simples: "10 minutos", "1 hora", "30 segundos"
  const singleRe = /(\d+)\s*(horas?|minutos?|min|segundos?|seg|h)\b/g;
  for (const m of t.matchAll(singleRe)) {
    const start = m.index ?? 0;
    if (consumed.some(([a, b]) => start >= a && start < b)) continue;
    candidates.push(unitToSeconds(Number(m[1]), m[2] === 'h' ? 'hora' : m[2]));
  }

  if (/meia hora/.test(t)) candidates.push(1800);
  if (/meio minuto/.test(t)) candidates.push(30);

  if (candidates.length === 0) return null;
  const best = Math.max(...candidates);
  if (best < MIN_TIMER_SECONDS || best > MAX_TIMER_SECONDS) return null;
  return best;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}
