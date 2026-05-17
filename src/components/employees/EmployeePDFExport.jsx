import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const REPORT_TYPES = [
  { id: 'completo', label: 'Relatório Completo', desc: 'Dados gerais + certificações + equipamentos + inspeções + exposição química + histórico' },
  { id: 'resumido', label: 'Resumo Executivo', desc: 'Dados principais, alertas e score operacional' },
  { id: 'epis', label: 'Somente EPIs', desc: 'Ficha completa de equipamentos e status operacional' },
  { id: 'inspecoes', label: 'Somente Inspeções', desc: 'Histórico completo de inspeções registradas' },
  { id: 'certificacoes', label: 'Somente Certificações', desc: 'Todas as certificações e treinamentos' },
];

export default function EmployeePDFExport({ employee, equipments, inspections, checklists: _checklists }) {
  const [selectedType, setSelectedType] = useState('completo');
  const [generating, setGenerating] = useState(false);

  const addHeader = (doc, title) => {
    doc.setFillColor(5, 9, 20);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(20, 184, 212);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ALTIVUS', 14, 16);
    doc.setFontSize(8);
    doc.setTextColor(160, 174, 192);
    doc.setFont('helvetica', 'normal');
    doc.text('Gestão Técnica em Altura', 14, 23);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 33);
    doc.setTextColor(109, 86, 232);
    doc.setFontSize(8);
    doc.text(`Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 150, 33);
    doc.setDrawColor(20, 184, 212);
    doc.setLineWidth(0.5);
    doc.line(0, 40, 210, 40);
  };

  const addSection = (doc, title, y) => {
    doc.setFillColor(20, 184, 212, 0.1);
    doc.setDrawColor(20, 184, 212);
    doc.setTextColor(20, 184, 212);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), 14, y);
    doc.setDrawColor(20, 184, 212);
    doc.setLineWidth(0.3);
    doc.line(14, y + 2, 196, y + 2);
    return y + 8;
  };

  const addRow = (doc, label, value, y) => {
    doc.setTextColor(113, 128, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label + ':', 14, y);
    doc.setTextColor(255, 255, 255);
    doc.text(value || '—', 60, y);
    return y + 6;
  };

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
      doc.setFont('helvetica');

      // Configuração dark
      doc.setFillColor(5, 9, 20);
      doc.rect(0, 0, 210, 297, 'F');

      addHeader(doc, 'PRONTUÁRIO OPERACIONAL DIGITAL');

      let y = 50;

      // Dados do colaborador
      y = addSection(doc, 'Dados do Colaborador', y);
      y = addRow(doc, 'Nome', employee.name, y);
      y = addRow(doc, 'Função', employee.role, y);
      y = addRow(doc, 'CPF', employee.cpf, y);
      y = addRow(doc, 'Admissão', employee.admission_date ? format(new Date(employee.admission_date + 'T12:00:00'), 'dd/MM/yyyy') : '—', y);
      y = addRow(doc, 'NR35', employee.nr35_level ? employee.nr35_level.toUpperCase() : 'Não certificado', y);
      y = addRow(doc, 'IRATA', employee.irata_level ? `Nível ${employee.irata_level}` : 'Não certificado', y);
      y = addRow(doc, 'Score', `${employee.operational_score ?? 100}/100`, y);
      y = addRow(doc, 'Status', employee.status === 'active' ? 'Ativo' : employee.status, y);

      y += 4;

      // Certificações
      if (selectedType === 'completo' || selectedType === 'resumido' || selectedType === 'certificacoes') {
        y = addSection(doc, 'Certificações e Treinamentos', y);
        if ((employee.certifications || []).length === 0) {
          doc.setTextColor(113, 128, 150);
          doc.setFontSize(8);
          doc.text('Nenhuma certificação cadastrada', 14, y);
          y += 8;
        } else {
          (employee.certifications || []).forEach(cert => {
            if (y > 260) { doc.addPage(); doc.setFillColor(5, 9, 20); doc.rect(0, 0, 210, 297, 'F'); y = 14; }
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.text(`${cert.name || cert.type}`, 14, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(113, 128, 150);
            doc.text(`Emissor: ${cert.issuer || '—'} | Emissão: ${cert.issued_date || '—'} | Validade: ${cert.expiry_date || '—'}`, 14, y + 5);
            y += 12;
          });
        }
        y += 2;
      }

      // Equipamentos
      if (selectedType === 'completo' || selectedType === 'epis') {
        if (y > 230) { doc.addPage(); doc.setFillColor(5, 9, 20); doc.rect(0, 0, 210, 297, 'F'); y = 14; }
        y = addSection(doc, `Equipamentos (${equipments.length})`, y);
        if (equipments.length === 0) {
          doc.setTextColor(113, 128, 150);
          doc.setFontSize(8);
          doc.text('Nenhum equipamento cadastrado', 14, y);
          y += 8;
        } else {
          equipments.forEach(eq => {
            if (y > 260) { doc.addPage(); doc.setFillColor(5, 9, 20); doc.rect(0, 0, 210, 297, 'F'); y = 14; }
            const statusColors = { normal: [0, 217, 154], observacao: [232, 125, 0], revisao_n3: [109, 86, 232], bloqueado: [252, 82, 82] };
            const sc = statusColors[eq.status] || statusColors.normal;
            doc.setFillColor(...sc, 0.15);
            doc.setTextColor(...sc);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text(eq.tag, 14, y);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8.5);
            doc.text(eq.name, 35, y);
            doc.setTextColor(113, 128, 150);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.text(`${eq.manufacturer || '—'} | CA: ${eq.ca_number || '—'} | Validade: ${eq.expiry_date || '—'} | Score: ${eq.operational_score ?? 100}`, 14, y + 5);
            y += 13;
          });
        }
        y += 2;
      }

      // Inspeções
      if (selectedType === 'completo' || selectedType === 'inspecoes') {
        if (y > 230) { doc.addPage(); doc.setFillColor(5, 9, 20); doc.rect(0, 0, 210, 297, 'F'); y = 14; }
        y = addSection(doc, `Inspeções (${inspections.length})`, y);
        if (inspections.length === 0) {
          doc.setTextColor(113, 128, 150);
          doc.setFontSize(8);
          doc.text('Nenhuma inspeção registrada', 14, y);
          y += 8;
        } else {
          inspections.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(insp => {
            if (y > 260) { doc.addPage(); doc.setFillColor(5, 9, 20); doc.rect(0, 0, 210, 297, 'F'); y = 14; }
            const eq = equipments.find(e => e.id === insp.equipment_id);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.text(`${format(new Date(insp.date + 'T12:00:00'), 'dd/MM/yyyy')} — ${insp.type}`, 14, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(113, 128, 150);
            doc.text(`${eq ? `${eq.tag} — ${eq.name}` : '—'} | Resultado: ${insp.result} | ${insp.inspector_name || '—'}`, 14, y + 5);
            y += 13;
          });
        }
      }

      // Aviso legal
      if (y > 250) { doc.addPage(); doc.setFillColor(5, 9, 20); doc.rect(0, 0, 210, 297, 'F'); y = 14; }
      doc.setDrawColor(109, 86, 232);
      doc.setLineWidth(0.3);
      doc.rect(14, y, 182, 16);
      doc.setTextColor(109, 86, 232);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('AVISO LEGAL:', 17, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(160, 174, 192);
      doc.text('A IA auxilia tecnicamente e não substitui inspeção formal, fabricante, Supervisor N3 ou responsável técnico.', 17, y + 11);

      const fileName = `prontuario_${employee.name.replace(/\s/g, '_')}_${selectedType}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
      toast.success('PDF exportado com sucesso!');
    } catch (e) {
      toast.error(`Erro ao gerar PDF: ${e.message}`);
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white">Relatórios PDF Enterprise</h3>
        <p className="text-xs mt-0.5" style={{ color: '#718096' }}>Exporte o prontuário operacional em formato profissional</p>
      </div>

      {/* Tipos de relatório */}
      <div className="space-y-2">
        {REPORT_TYPES.map(rt => (
          <button key={rt.id} onClick={() => setSelectedType(rt.id)}
            className="w-full text-left p-4 rounded-xl transition-all"
            style={{
              background: selectedType === rt.id ? 'rgba(20,184,212,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selectedType === rt.id ? 'rgba(20,184,212,0.35)' : 'rgba(255,255,255,0.07)'}`,
            }}>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  border: `2px solid ${selectedType === rt.id ? '#14B8D4' : 'rgba(255,255,255,0.2)'}`,
                  background: selectedType === rt.id ? 'rgba(20,184,212,0.2)' : 'transparent',
                }}>
                {selectedType === rt.id && <div className="w-2 h-2 rounded-full" style={{ background: '#14B8D4' }} />}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: selectedType === rt.id ? '#FFFFFF' : '#A0AEC0' }}>{rt.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#4A5568' }}>{rt.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Preview do que vai no PDF */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#718096' }}>O PDF incluirá</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Dados pessoais', ok: true },
            { label: 'Habilitações NR35/IRATA', ok: true },
            { label: 'Certificações', ok: selectedType === 'completo' || selectedType === 'certificacoes' || selectedType === 'resumido' },
            { label: 'Equipamentos / EPIs', ok: selectedType === 'completo' || selectedType === 'epis' },
            { label: 'Inspeções', ok: selectedType === 'completo' || selectedType === 'inspecoes' },
            { label: 'Score operacional', ok: true },
            { label: 'Aviso legal NR35', ok: true },
            { label: 'Cabeçalho ALTIVUS', ok: true },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: item.ok ? '#00D99A' : '#4A5568' }} />
              <span className="text-[11px]" style={{ color: item.ok ? '#A0AEC0' : '#4A5568' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Aviso legal */}
      <div className="rounded-xl p-3 flex items-start gap-2"
        style={{ background: 'rgba(109,86,232,0.06)', border: '1px solid rgba(109,86,232,0.15)' }}>
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#6D56E8' }} />
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          O relatório PDF contém aviso legal obrigatório: a IA auxilia tecnicamente e não substitui inspeção formal, Supervisor N3 ou responsável técnico.
        </p>
      </div>

      <Button className="w-full gap-2" onClick={generatePDF} disabled={generating}>
        {generating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Gerando PDF...</>
        ) : (
          <><Download className="w-4 h-4" /> Exportar PDF — {REPORT_TYPES.find(r => r.id === selectedType)?.label}</>
        )}
      </Button>
    </div>
  );
}
