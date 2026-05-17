import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PRIMARY = [37, 99, 235];    // blue-600
const DARK    = [15, 23, 42];     // slate-900
const GRAY    = [100, 116, 139];  // slate-500
const LIGHT   = [241, 245, 249];  // slate-100
const GREEN   = [22, 163, 74];    // green-600
const WHITE   = [255, 255, 255];

function fmt(dateStr) {
  if (!dateStr) return '-';
  try { return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR }); } catch { return dateStr; }
}

function statusLabel(s) {
  const map = { not_started: 'Não Iniciado', in_progress: 'Em Andamento', delayed: 'Atrasado', completed: 'Concluído' };
  return map[s] || s;
}

function priorityLabel(p) {
  const map = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' };
  return map[p] || p;
}

function roleLabel(r) {
  const map = { lider: 'Líder', executor: 'Executor', apoio: 'Apoio' };
  return map[r] || r;
}

function materialTypeLabel(t) {
  const map = { epi: 'EPI', ferramenta: 'Ferramenta', consumivel: 'Consumível' };
  return map[t] || t;
}

export function generateActivityReport({ activity, team, area, contract, unit, serviceType, employees, activityEmployees, materials, activityMaterials }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const MARGIN = 16;
  const CONTENT_W = W - MARGIN * 2;
  let y = 0;

  // ── HEADER ──────────────────────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 40, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Atividade', MARGIN, 17);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em ${fmt(new Date().toISOString())}`, MARGIN, 25);

  // Badge "CONCLUÍDA"
  doc.setFillColor(...GREEN);
  doc.roundedRect(W - MARGIN - 36, 13, 36, 9, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CONCLUÍDA', W - MARGIN - 18, 19, { align: 'center' });

  y = 50;

  // ── TITLE ──────────────────────────────────────────────────────────────────
  doc.setTextColor(...DARK);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(activity.title || 'Sem título', MARGIN, y);
  y += 8;

  // Separator
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, W - MARGIN, y);
  y += 8;

  // ── SECTION helper ────────────────────────────────────────────────────────
  function sectionTitle(title) {
    doc.setFillColor(...LIGHT);
    doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
    doc.setTextColor(...PRIMARY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), MARGIN + 3, y + 5);
    y += 10;
    doc.setTextColor(...DARK);
  }

  function row(label, value, col = 0, cols = 1) {
    const colW = CONTENT_W / cols;
    const xOff = MARGIN + col * colW;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text(label, xOff, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(String(value ?? '-'), xOff, y + 4.5);
  }

  function twoRows(pairs) {
    // pairs: [[label,val], [label,val]]
    pairs.forEach(([l, v], i) => row(l, v, i, pairs.length));
    y += 12;
  }

  // ── 1. DADOS DA ATIVIDADE ────────────────────────────────────────────────
  sectionTitle('1. Dados da Atividade');
  twoRows([['Título', activity.title || '-'], ['Status', statusLabel(activity.status)]]);
  twoRows([['Prioridade', priorityLabel(activity.priority)], ['Tipo de Serviço', serviceType?.name || '-']]);
  twoRows([['Contrato', contract?.name || '-'], ['Unidade', unit?.name || '-']]);
  twoRows([['Área', area?.name || '-'], ['Equipe', team?.name || '-']]);
  twoRows([['Data Início', fmt(activity.start_date)], ['Data Fim', fmt(activity.end_date)]]);

  // ── 2. HORAS PLANEJADAS VS REAIS ─────────────────────────────────────────
  sectionTitle('2. Desempenho de Horas e Descidas');

  const hoursPlanned = activity.hours_planned || 0;
  const hoursActual  = activity.hours_actual  || 0;
  const efficiency   = hoursActual > 0 ? Math.round((hoursPlanned / hoursActual) * 100) : 0;
  const exceeded     = Math.max(0, hoursActual - hoursPlanned);

  twoRows([['Horas Planejadas', `${hoursPlanned}h`], ['Horas Realizadas', `${hoursActual}h`]]);
  twoRows([['Eficiência', `${efficiency}%`], ['Tempo Excedido', exceeded > 0 ? `+${exceeded}h` : 'Dentro do prazo']]);
  twoRows([['Descidas Planejadas', activity.descents_planned || 0], ['Descidas Realizadas', activity.descents_completed || 0]]);
  twoRows([['Progresso', `${activity.progress || 0}%`], ['Tempo por Descida', `${activity.time_per_descent || 0}h`]]);

  // ── 3. EQUIPE ENVOLVIDA ──────────────────────────────────────────────────
  sectionTitle('3. Equipe Envolvida');

  const teamMembers = activityEmployees
    .map(ae => {
      const emp = employees.find(e => e.id === ae.employee_id);
      return emp ? { name: emp.name, role: roleLabel(ae.role_in_activity), hours: ae.hours_worked || 0 } : null;
    })
    .filter(Boolean);

  if (teamMembers.length === 0) {
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text('Nenhum colaborador registrado nesta atividade.', MARGIN, y);
    y += 8;
  } else {
    // Table header
    const cols = [60, 50, 40, 28];
    const headers = ['Colaborador', 'Função', 'Horas Trabalhadas', 'Equipe'];
    doc.setFillColor(...PRIMARY);
    doc.rect(MARGIN, y, CONTENT_W, 6.5, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let xc = MARGIN + 2;
    headers.forEach((h, i) => { doc.text(h, xc, y + 4.5); xc += cols[i]; });
    y += 6.5;

    teamMembers.forEach((m, idx) => {
      if (idx % 2 === 0) { doc.setFillColor(...LIGHT); doc.rect(MARGIN, y, CONTENT_W, 6.5, 'F'); }
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      xc = MARGIN + 2;
      [m.name, m.role, `${m.hours}h`, team?.name || '-'].forEach((v, i) => { doc.text(String(v), xc, y + 4.5); xc += cols[i]; });
      y += 6.5;
    });
    y += 4;
  }

  // ── 4. MATERIAIS UTILIZADOS ───────────────────────────────────────────────
  // Check page space
  if (y > 230) { doc.addPage(); y = 20; }
  sectionTitle('4. Materiais Utilizados');

  const usedMaterials = activityMaterials
    .map(am => {
      const mat = materials.find(m => m.id === am.material_id);
      return mat ? { name: mat.name, type: materialTypeLabel(mat.type), qty: am.quantity_used, unit: mat.unit || 'un' } : null;
    })
    .filter(Boolean);

  if (usedMaterials.length === 0) {
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text('Nenhum material registrado nesta atividade.', MARGIN, y);
    y += 8;
  } else {
    const cols = [80, 50, 30, 18];
    const headers = ['Material', 'Tipo', 'Quantidade', 'Un.'];
    doc.setFillColor(...PRIMARY);
    doc.rect(MARGIN, y, CONTENT_W, 6.5, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let xc = MARGIN + 2;
    headers.forEach((h, i) => { doc.text(h, xc, y + 4.5); xc += cols[i]; });
    y += 6.5;

    usedMaterials.forEach((m, idx) => {
      if (idx % 2 === 0) { doc.setFillColor(...LIGHT); doc.rect(MARGIN, y, CONTENT_W, 6.5, 'F'); }
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      xc = MARGIN + 2;
      [m.name, m.type, String(m.qty), m.unit].forEach((v, i) => { doc.text(v, xc, y + 4.5); xc += cols[i]; });
      y += 6.5;
    });
    y += 4;
  }

  // ── 5. OBSERVAÇÕES ────────────────────────────────────────────────────────
  if (y > 230) { doc.addPage(); y = 20; }
  sectionTitle('5. Observações e Riscos');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  doc.text('Observações Técnicas:', MARGIN, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  const obsLines = doc.splitTextToSize(activity.observations || 'Nenhuma observação registrada.', CONTENT_W);
  doc.text(obsLines, MARGIN, y);
  y += obsLines.length * 5 + 4;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  doc.text('Riscos Identificados:', MARGIN, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  const riskLines = doc.splitTextToSize(activity.risks || 'Nenhum risco identificado.', CONTENT_W);
  doc.text(riskLines, MARGIN, y);
  y += riskLines.length * 5 + 6;

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...LIGHT);
    doc.rect(0, 287, W, 10, 'F');
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.3);
    doc.line(0, 287, W, 287);
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestão Industrial — Relatório Confidencial', MARGIN, 293);
    doc.text(`Página ${i} de ${pageCount}`, W - MARGIN, 293, { align: 'right' });
  }

  doc.save(`relatorio_${(activity.title || 'atividade').replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
}