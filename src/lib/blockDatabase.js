/**
 * Base fixa de metragem dos blocos — ALTIVUS
 * Fonte oficial: levantamento técnico do contrato
 */

export const BLOCK_DATABASE = {
  TELHADOS: {
    'ETE':      1242,
    'BLOCO 5':  5484,
    'BLOCO 6':  3273,
    'BLOCO 7':  3975,
    'BLOCO 8':  796,
    'BLOCO 9':  2026,
    'BLOCO 10': 7150,
  },
  FACHADAS: {
    'PORTARIA':    292,
    'CRECHE':      142,
    'RESTAURANTE': 1993,
    'BLOCO 5':     432,
    'BLOCO 6':     3500,
    'BLOCO 7':     10788,
    'BLOCO 8':     682,
    'BLOCO 9':     3497,
    'HELIPONTO':   110,
    'BLOCO 10':    5411,
    'BLOCO 13':    7008,
  },
};

/**
 * Retorna a área em m² de um bloco dado tipo_servico e bloco_nome.
 * Busca de forma case-insensitive.
 */
export function getBlockArea(tipo_servico, bloco_nome) {
  if (!tipo_servico || !bloco_nome) return 0;
  const db = tipo_servico === 'telhado' ? BLOCK_DATABASE.TELHADOS : BLOCK_DATABASE.FACHADAS;
  const key = Object.keys(db).find(k => k.toLowerCase() === bloco_nome.toLowerCase());
  return key ? db[key] : 0;
}

/** Lista de blocos por tipo de serviço */
export function getBlocosList(tipo_servico) {
  const db = tipo_servico === 'telhado' ? BLOCK_DATABASE.TELHADOS : BLOCK_DATABASE.FACHADAS;
  return Object.entries(db).map(([name, area]) => ({ name, area }));
}