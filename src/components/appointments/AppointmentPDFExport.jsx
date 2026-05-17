import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

function generatePDF(a, isDraft = false) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 18;
  let y = 0;

  const pageH = 297;
  const checkY = (h = 10) => { if (y + h > pageH - 20) { doc.addPage(); y = 20; } };

  // Colors
  const neonBlue  = [20, 184, 212];
  const neonGreen = [0, 217, 154];
  const dark      = [5, 9, 20];
  const gray      = [100, 116, 139];
  const white     = [255, 255, 255];
  const orange    = [232, 125, 0];
  const red       = [220, 55, 55];

  // ── Header ──
  doc.setFillColor(...dark);
  doc.rect(0, 0, W, 40, 'F');
  doc.setFillColor(...neonBlue);
  doc.rect(0, 38, W, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...white);
  doc.text('ALTIVUS', margin, 18);

  doc.setFontSize(8);
  doc.setTextColor(...neonBlue);
  doc.text('GESTÃO TÉCNICA EM ALTURA', margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...white);
  doc.text('RELATÓRIO DE APONTAMENTO DE CAMPO', W / 2, 14, { align: 'center' });
  if (isDraft) {
    doc.setFontSize(16);
    doc.setTextColor(...orange);
    doc.text('RASCUNHO', W / 2, 26, { align: 'center' });
  }

  doc.setFontSize(8);
  doc.setTextColor(...gray);
  const proto = `APT-${a.id?.slice(-6).toUpperCase() || 'N/A'}`;
  doc.text(`Protocolo: ${proto}`, W - margin, 18, { align: 'right' });
  doc.text(`Emissão: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, W - margin, 24, { align: 'right' });

  y = 50;

  const section = (title, color = neonBlue) => {
    checkY(12);
    doc.setFillColor(...color, 0.08);
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, W - margin * 2, 7, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...color);
    doc.text(title.toUpperCase(), margin + 3, y + 5);
    y += 10;
  };

  const field = (label, value, colW) => {
    if (!value) return;
    checkY(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text(label.toUpperCase(), margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 40, 60);
    const lines = doc.splitTextToSize(String(value), (colW || W - margin * 2));
    doc.text(lines, margin, y + 4);
    y += 5 + lines.length * 4.5;
  };

  const row2 = (items) => {
    const colW = (W - margin * 2 - 5) / 2;
    let maxY = y;
    items.forEach((item, i) => {
      if (!item.value) return;
      const x = margin + i * (colW + 5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...gray);
      doc.text(item.label.toUpperCase(), x, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 40, 60);
      const lines = doc.splitTextToSize(String(item.value), colW);
      doc.text(lines, x, y + 4);
      const endY = y + 5 + lines.length * 4.5;
      if (endY > maxY) maxY = endY;
    });
    y = maxY;
  };

  // ── Identification ──
  section('Identificação');
  row2([
    { label: 'Colaborador', value: a.employee_name },
    { label: 'Função', value: a.employee_role },
  ]);
  row2([
    { label: 'Data', value: a.date ? format(new Date(a.date), "dd/MM/yyyy") : '' },
    { label: 'Horário', value: `${a.start_time || '—'} – ${a.end_time || '—'} (${a.total_hours || 0}h)` },
  ]);
  row2([
    { label: 'Contrato', value: a.contract_id },
    { label: 'Local', value: a.location },
  ]);
  row2([
    { label: 'Status', value: a.status },
    { label: 'Progresso', value: `${a.progress || 0}%` },
  ]);
  y += 3;

  // ── Execution ──
  section('Execução');
  field('Condição Inicial', a.initial_condition);
  field('Observação Inicial', a.initial_observation);
  field('O que foi realizado', a.report_what_was_done);
  field('Avanço', a.report_progress);
  field('Descrição Final', a.final_description);
  row2([
    { label: 'Produção', value: a.production_qty ? `${a.production_qty} ${a.production_unit || ''}` : '' },
    { label: 'Situação Final', value: a.final_situation },
  ]);
  y += 3;

  // ── Occurrences ──
  if (a.report_impediments || a.report_risks || a.report_incidents || a.incidents) {
    section('Ocorrências e Riscos', red);
    field('Impedimentos', a.report_impediments);
    field('Riscos / Desvios', a.report_risks);
    field('Incidentes', a.report_incidents || a.incidents);
    if (a.report_rework) { field('Retrabalho', 'Sim — houve necessidade de retrabalho'); }
    y += 3;
  }

  // ── Resources ──
  section('Recursos Utilizados', [109, 86, 232]);
  field('Materiais', a.report_materials);
  field('Equipamentos', a.report_equipment);
  row2([
    { label: 'Clima', value: a.report_weather },
    { label: 'Condição de Segurança', value: a.report_safety_condition },
  ]);
  y += 3;

  // ── Next steps ──
  section('Próximos Passos', neonGreen);
  field('Pendências', a.pending_items || a.report_pending_items);
  field('Próxima Ação', a.report_next_action);
  field('Obs. Colaborador', a.report_worker_observations);
  field('Obs. Responsável', a.report_responsible_observations);
  y += 3;

  // ── Approval ──
  if (a.approval_status === 'approved' || a.approval_status === 'rejected') {
    section('Aprovação');
    row2([
      { label: 'Decisão', value: a.approval_status === 'approved' ? 'APROVADO' : 'REPROVADO' },
      { label: 'Aprovado por', value: a.approval_by },
    ]);
    if (a.approval_at) field('Data da Aprovação', format(new Date(a.approval_at), "dd/MM/yyyy HH:mm"));
    if (a.approval_notes) field('Observações', a.approval_notes);
    y += 3;
  }

  // ── Signature block ──
  checkY(50);
  section('Assinaturas');
  const sigY = y;
  const sigW = (W - margin * 2) / 2 - 4;

  const drawSig = (label, name, x, syy) => {
    doc.setDrawColor(...gray);
    doc.setLineWidth(0.3);
    doc.line(x, syy, x + sigW, syy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text(label.toUpperCase(), x, syy + 4);
    if (name) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 40, 60);
      doc.text(name, x, syy + 8);
    }
  };

  drawSig('Colaborador', a.signature_worker, margin, sigY);
  drawSig('Responsável de Campo', a.signature_responsible, margin + sigW + 8, sigY);
  y = sigY + 14;
  drawSig('Supervisor', a.signature_supervisor, margin, y);
  drawSig('Cliente / Fiscal', a.signature_client, margin + sigW + 8, y);
  y += 14;

  // Legal clause
  checkY(16);
  doc.setFillColor(240, 245, 255);
  doc.roundedRect(margin, y, W - margin * 2, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.text('"Declaro que as informações acima refletem as atividades executadas em campo na data informada."', W / 2, y + 8, { align: 'center', maxWidth: W - margin * 2 - 4 });

  // Signature timestamp
  if (a.signature_at) {
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text(`Assinado digitalmente em ${format(new Date(a.signature_at), "dd/MM/yyyy HH:mm")}`, W / 2, y, { align: 'center' });
  }

  // Footer on all pages
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...dark);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text('ALTIVUS — Gestão Técnica em Altura', margin, 292);
    doc.text(`Pág. ${i}/${pages}`, W - margin, 292, { align: 'right' });
  }

  return doc;
}

export default function AppointmentPDFExport({ appointment, onClose }) {
  const [loading, setLoading] = useState(false);

  const download = async (isDraft) => {
    setLoading(true);
    const doc = generatePDF(appointment, isDraft);
    const name = `ALTIVUS_APT_${appointment.employee_name?.replace(/\s/g, '_') || 'relatorio'}_${appointment.date || 'data'}.pdf`;
    doc.save(name);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.98),rgba(6,10,22,0.99))', border: '1px solid rgba(20,184,212,0.20)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: '#14B8D4' }} />
            <h3 className="text-white font-bold">Exportar PDF</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: '#718096' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(20,184,212,0.06)', border: '1px solid rgba(20,184,212,0.18)' }}>
          <p className="text-sm font-semibold text-white mb-1">{appointment.employee_name || '—'}</p>
          <p className="text-xs" style={{ color: '#718096' }}>
            {appointment.date || '—'} · {appointment.total_hours || 0}h · {(appointment.photos_before || []).length} fotos antes · {(appointment.photos_after || []).length} fotos depois
          </p>
        </div>

        <div className="space-y-3">
          <Button className="w-full gap-2" onClick={() => download(false)} disabled={loading}
            style={{ background: 'linear-gradient(135deg,#00D99A,#14B8D4)', color: '#020B0F', fontWeight: 700 }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Relatório Completo (PDF)
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={() => download(true)} disabled={loading}>
            <Download className="w-4 h-4" /> PDF Rascunho (marca d'água)
          </Button>
        </div>

        <p className="text-[10px] text-center mt-4" style={{ color: '#4A5568' }}>
          O PDF inclui dados de identificação, execução, fotos, reporte, assinaturas e histórico de aprovação.
        </p>
      </div>
    </div>
  );
}
