/**
 * Motor de Planejamento Automático — Altivus
 * Parâmetros fixos do contrato de acesso por corda
 */

export const PARAMS = {
  produtividade_m2_por_descida: 2,   // m² lavados por descida
  tempo_por_descida_horas: 1.33,      // horas por descida
  horas_dia: 8,                        // horas produtivas por dia
};

// Re-exporta do blockDatabase (fonte canônica única)
import { BLOCK_DATABASE } from '@/lib/blockDatabase';
export const AREAS_TELHADOS = BLOCK_DATABASE.TELHADOS;
export const AREAS_FACHADAS = BLOCK_DATABASE.FACHADAS;

/**
 * Calcula o plano de uma atividade dados área e número de alpinistas
 */
export function calcularPlano(area_m2, numero_alpinistas = 1) {
  const descidas_planejadas = Math.ceil(area_m2 / PARAMS.produtividade_m2_por_descida);
  const tempo_total_horas   = descidas_planejadas * PARAMS.tempo_por_descida_horas;
  const tempo_por_equipe    = tempo_total_horas / Math.max(1, numero_alpinistas);
  const dias_planejados     = Math.ceil(tempo_por_equipe / PARAMS.horas_dia);

  return {
    descidas_planejadas,
    tempo_total_horas: +tempo_total_horas.toFixed(2),
    tempo_por_equipe:  +tempo_por_equipe.toFixed(2),
    dias_planejados,
  };
}

/**
 * Calcula previsão inteligente baseada na execução real
 */
export function calcularPrevisao(activity, sessions = []) {
  const descidas_realizadas = activity.descents_completed || 0;
  const descidas_planejadas = activity.descents_planned   || 0;
  const descidas_restantes  = Math.max(0, descidas_planejadas - descidas_realizadas);

  // Horas trabalhadas a partir das sessões finalizadas
  const horas_trabalhadas = sessions
    .filter(s => s.status === 'finalizado' && s.hora_inicio && s.hora_fim)
    .reduce((acc, s) => {
      const diff = (new Date(s.hora_fim) - new Date(s.hora_inicio)) / 3_600_000;
      return acc + diff;
    }, 0);

  const produtividade_real = horas_trabalhadas > 0 && descidas_realizadas > 0
    ? descidas_realizadas / horas_trabalhadas
    : null;

  const produtividade_ref = 1 / PARAMS.tempo_por_descida_horas; // ≈0.75 descidas/h

  const prod = produtividade_real ?? produtividade_ref;

  const tempo_restante_horas = prod > 0 ? descidas_restantes / prod : 0;
  const dias_restantes_calc  = Math.ceil(tempo_restante_horas / PARAMS.horas_dia);

  const atrasado = dias_restantes_calc > (activity.dias_planejados || 0) - (sessions.length || 0);

  // Sugestão de equipe (baseado nos dias restantes do calendário)
  const dias_restantes_calendario = activity.dias_planejados
    ? Math.max(1, activity.dias_planejados - sessions.filter(s => s.status === 'finalizado').length)
    : 1;

  const alpinistas_necessarios = tempo_restante_horas > 0
    ? Math.ceil(tempo_restante_horas / (PARAMS.horas_dia * dias_restantes_calendario))
    : null;

  return {
    descidas_realizadas,
    descidas_restantes,
    horas_trabalhadas: +horas_trabalhadas.toFixed(2),
    produtividade_real: produtividade_real ? +produtividade_real.toFixed(3) : null,
    tempo_restante_horas: +tempo_restante_horas.toFixed(2),
    dias_restantes_calc,
    atrasado,
    alpinistas_necessarios,
    progresso_pct: descidas_planejadas > 0
      ? Math.min(100, Math.round((descidas_realizadas / descidas_planejadas) * 100))
      : 0,
  };
}

/**
 * Gera alertas automáticos para uma atividade
 */
export function gerarAlertas(activity, previsao) {
  const alertas = [];

  if (previsao.atrasado && activity.status !== 'completed') {
    alertas.push({ tipo: 'atraso', msg: 'Atividade com previsão de atraso' });
  }

  if (previsao.produtividade_real !== null) {
    const prod_ref = 1 / PARAMS.tempo_por_descida_horas;
    if (previsao.produtividade_real < prod_ref * 0.7) {
      alertas.push({ tipo: 'baixa_produtividade', msg: 'Produtividade abaixo de 70% da referência' });
    }
  }

  if (
    previsao.alpinistas_necessarios !== null &&
    (activity.num_alpinistas || 1) < previsao.alpinistas_necessarios
  ) {
    alertas.push({
      tipo: 'falta_equipe',
      msg: `Sugestão: aumentar equipe para ${previsao.alpinistas_necessarios} alpinista(s)`,
    });
  }

  return alertas;
}