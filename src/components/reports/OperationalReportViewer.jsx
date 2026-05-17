/**
 * Visualizador do Relatório Final de Atividade — layout padrão ALTIVUS
 * Dark theme profissional, fiel ao design das imagens de referência
 */
import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { X, Download, Printer, CheckCircle2, FileText, Link2, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const STATUS_CFG = {
  draft:     { l: 'Rascunho',  c: '#718096', bg: 'rgba(113,128,150,0.15)' },
  generated: { l: 'Gerado',    c: '#14B8D4', bg: 'rgba(20,184,212,0.15)' },
  approved:  { l: 'Concluída', c: '#00D99A', bg: 'rgba(0,217,154,0.15)' },
  archived:  { l: 'Arquivado', c: '#4A5568', bg: 'rgba(74,85,104,0.15)' },
};

function fmtDate(iso, withTime = false) {
  if (!iso) return '—';
  try {
    const d = iso.length === 10 ? new Date(iso + 'T12:00:00') : new Date(iso);
    return withTime
      ? format(d, "dd/MM/yyyy - HH:mm")
      : format(d, 'dd/MM/yyyy');
  } catch { return '—'; }
}

function fmtTime(iso) {
  if (!iso) return '—';
  try { return format(new Date(iso), 'HH:mm'); } catch { return '—'; }
}

export default function OperationalReportViewer({ report, onClose }) {
  const printRef = useRef();
  if (!report) return null;

  const act      = report.activity_snapshot || {};
  const team     = report.team_snapshot || [];
  const sessions = report.sessions_snapshot || [];
  const status   = STATUS_CFG[report.status] || STATUS_CFG.generated;

  const totalDescidas = sessions.reduce((a, s) => a + (s.descidas_realizadas || 0), 0);
  const totalMinutos  = sessions.reduce((a, s) => a + (s.tempo_total_minutos || 0), 0);
  const totalHH       = (totalMinutos / 60).toFixed(1);
  const areaM2        = act.area_m2 || 0;
  const productivity  = totalHH > 0 ? (areaM2 / parseFloat(totalHH)).toFixed(1) : '—';

  const photosBefore = report.photos_before || [];
  const photosDuring = report.photos_during || [];
  const photosAfter  = report.photos_after  || [];

  const firstSession = sessions[0];
  const lastSession  = sessions[sessions.length - 1];

  const handlePDF = async () => {
    const el = printRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#0d1117' });
    const imgData = canvas.toDataURL('image/jpeg', 0.93);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = canvas.height / canvas.width;
    const imgH = pageW * ratio;
    let y = 0;
    while (y < imgH) {
      if (y > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, -y, pageW, imgH);
      y += pageH;
    }
    pdf.save(`${report.report_number || 'relatorio'}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  // ── styles shorthand ──
  const S = {
    card: { background: '#161d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 },
    label: { color: '#718096', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
    value: { color: '#e2e8f0', fontSize: 13, fontWeight: 600 },
    sectionTitle: { color: '#e2e8f0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.10em' },
    divider: { borderTop: '1px solid rgba(255,255,255,0.07)', margin: '0' },
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>

      {/* Toolbar flutuante */}
      <div className="fixed top-4 right-4 z-[170] flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 text-xs">
          <Printer className="w-3.5 h-3.5" /> Imprimir
        </Button>
        <Button size="sm" onClick={handlePDF} className="gap-1.5 text-xs"
          style={{ background: 'linear-gradient(135deg,#14B8D4,#6D56E8)', color: '#fff' }}>
          <Download className="w-3.5 h-3.5" /> Exportar PDF
        </Button>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ══════════════ DOCUMENTO ══════════════ */}
      <div ref={printRef}
        className="w-full max-w-[860px] rounded-2xl overflow-hidden shadow-2xl mt-14 mb-8"
        style={{ background: '#0d1117', fontFamily: 'Inter, sans-serif', color: '#e2e8f0' }}>

        {/* ── TOP HEADER ── */}
        <div className="px-8 py-6 flex items-start justify-between"
          style={{ background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div style={{ width: 44, height: 40, filter: 'drop-shadow(0 0 8px rgba(20,184,212,0.65))' }}>
              <svg viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                <path d="M20 2L38 34H2L20 2Z" stroke="#14B8D4" strokeWidth="2.2" fill="none" strokeLinejoin="round"/>
                <path d="M20 10L32 32H8L20 10Z" stroke="#6D56E8" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.7"/>
                <line x1="11" y1="26" x2="29" y2="26" stroke="#14B8D4" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>ALTIVUS</p>
              <p style={{ fontSize: 9, color: '#14B8D4', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1 }}>Gestão Técnica em Altura</p>
            </div>
          </div>

          {/* Center title */}
          <div className="text-center flex-1 mx-8">
            <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Relatório Final de Atividade
            </p>
            <div className="flex justify-center mt-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: status.bg, color: status.c, border: `1px solid ${status.c}50` }}>
                <CheckCircle2 className="w-3 h-3" /> {status.l.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Right meta */}
          <div className="text-right">
            <p style={{ fontSize: 9, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Relatório Nº</p>
            <p style={{ fontSize: 15, fontWeight: 900, color: '#14B8D4' }}>{report.report_number || '—'}</p>
            <p style={{ fontSize: 9, color: '#718096', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Data de Emissão</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{fmtDate(report.generated_at, true)}</p>
          </div>
        </div>

        {/* ── ATIVIDADE INFO + COVER PHOTO ── */}
        <div className="px-8 py-5 grid gap-6" style={{ gridTemplateColumns: photosBefore.length > 0 || photosDuring.length > 0 ? '1fr 220px' : '1fr', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="space-y-4">
            {/* Activity title */}
            <div>
              <p style={S.label}>Atividade</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 2 }}>{act.title || report.title || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p style={S.label}>Contrato</p>
                <p style={{ ...S.value, marginTop: 2 }}>{act.contract_id || '—'}</p>
              </div>
              <div>
                <p style={S.label}>Período de Execução</p>
                <p style={{ ...S.value, marginTop: 2 }}>
                  {fmtDate(act.start_date)} a {fmtDate(act.end_date)}
                </p>
              </div>
              <div>
                <p style={S.label}>Local / Bloco</p>
                <p style={{ ...S.value, marginTop: 2 }}>{act.bloco_nome || '—'}</p>
              </div>
              <div>
                <p style={S.label}>Área Atendida</p>
                <p style={{ ...S.value, marginTop: 2 }}>{areaM2 > 0 ? `${areaM2.toLocaleString('pt-BR')} m²` : '—'}</p>
              </div>
            </div>
          </div>

          {/* Cover photo */}
          {(photosDuring.length > 0 || photosBefore.length > 0 || photosAfter.length > 0) && (
            <div className="rounded-xl overflow-hidden" style={{ height: 160 }}>
              <img
                src={photosDuring[0] || photosBefore[0] || photosAfter[0]}
                alt="Cover"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>

        <div className="px-8 py-6 space-y-6">

          {/* ── EQUIPE + PERFORMANCE ── */}
          <div className="grid grid-cols-2 gap-4">

            {/* Equipe Executora */}
            <div style={S.card} className="p-4">
              <p style={{ ...S.sectionTitle, marginBottom: 12 }}>Equipe Executora</p>
              {team.length === 0 ? (
                <p style={{ color: '#718096', fontSize: 12 }}>Sem dados de equipe</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {team.slice(0, 6).map((m, i) => (
                    <div key={i} className="flex flex-col items-center text-center gap-1.5">
                      <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-lg font-black"
                        style={{ background: 'linear-gradient(135deg,rgba(20,184,212,0.25),rgba(109,86,232,0.25))', border: '2px solid rgba(20,184,212,0.3)', color: '#14B8D4' }}>
                        {m.photo_url
                          ? <img src={m.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (m.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>{m.name}</p>
                        <p style={{ fontSize: 10, color: '#718096' }}>{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo de Performance */}
            <div style={S.card} className="p-4">
              <p style={{ ...S.sectionTitle, marginBottom: 12 }}>Resumo de Performance</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: 'Área Planejada',    v: areaM2 > 0 ? `${areaM2.toLocaleString('pt-BR')} m²` : '—', c: '#14B8D4' },
                  { l: 'Área Executada',    v: areaM2 > 0 ? `${Math.round(areaM2 * (act.progress || 0) / 100).toLocaleString('pt-BR')} m²` : '—', c: '#14B8D4' },
                  { l: 'Progresso',         v: `${act.progress || 0}%`, c: '#00D99A' },
                  { l: 'Descidas Realizadas', v: totalDescidas, c: '#6D56E8' },
                  { l: 'HH Aplicado',       v: `${totalHH}h`, c: '#E87D00' },
                  { l: 'Produtividade Média', v: productivity !== '—' ? `${productivity} m²/h` : '—', c: '#14B8D4' },
                ].map(k => (
                  <div key={k.l} className="text-center p-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: k.c }}>{k.v}</p>
                    <p style={{ fontSize: 9, color: '#718096', marginTop: 2 }}>{k.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RESUMO DE EXECUÇÃO (timeline) ── */}
          <div style={S.card} className="p-4">
            <p style={{ ...S.sectionTitle, marginBottom: 14 }}>Resumo de Execução</p>
            <div className="flex items-center gap-4">
              {/* Start */}
              <div className="text-center shrink-0">
                <p style={S.label}>Início da Atividade</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(20,184,212,0.15)', border: '1px solid rgba(20,184,212,0.3)' }}>
                    <span style={{ fontSize: 10 }}>📅</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{fmtDate(act.start_date)}</p>
                    {firstSession?.hora_inicio && (
                      <p style={{ fontSize: 11, color: '#718096' }}>{fmtTime(firstSession.hora_inicio)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress line */}
              <div className="flex-1 flex flex-col items-center">
                <div className="relative w-full flex items-center">
                  <div className="w-3 h-3 rounded-full shrink-0 z-10" style={{ background: '#00D99A', boxShadow: '0 0 8px #00D99A' }} />
                  <div className="flex-1 h-0.5 relative" style={{ background: 'rgba(0,217,154,0.2)' }}>
                    <div className="h-full" style={{ width: `${act.progress || 0}%`, background: '#00D99A' }} />
                  </div>
                  <div className="w-3 h-3 rounded-full shrink-0 z-10" style={{ background: '#00D99A', boxShadow: '0 0 8px #00D99A' }} />
                </div>
                <div className="text-center mt-1">
                  <p style={{ fontSize: 12, fontWeight: 800, color: '#00D99A' }}>{sessions.length} dias</p>
                  <p style={{ fontSize: 10, color: '#718096' }}>{act.progress || 0}%</p>
                </div>
              </div>

              {/* End */}
              <div className="text-center shrink-0">
                <p style={S.label}>Conclusão da Atividade</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(0,217,154,0.15)', border: '1px solid rgba(0,217,154,0.3)' }}>
                    <span style={{ fontSize: 10 }}>📅</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{fmtDate(act.end_date)}</p>
                    {lastSession?.hora_fim && (
                      <p style={{ fontSize: 11, color: '#718096' }}>{fmtTime(lastSession.hora_fim)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RELATÓRIO FOTOGRÁFICO ── */}
          {(photosBefore.length > 0 || photosDuring.length > 0 || photosAfter.length > 0) && (
            <div style={S.card} className="p-4">
              <p style={{ ...S.sectionTitle, marginBottom: 12 }}>Relatório Fotográfico</p>
              <div className="grid grid-cols-4 gap-2">
                {/* ANTES */}
                <div>
                  <p style={{ fontSize: 9, fontWeight: 800, textAlign: 'center', color: '#E87D00', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Antes</p>
                  <div className="space-y-1.5">
                    {photosBefore.slice(0, 2).map((url, i) => (
                      <div key={i} className="rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                    {photosBefore.length === 0 && (
                      <div className="rounded-lg flex items-center justify-center" style={{ aspectRatio: '4/3', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: 10, color: '#718096' }}>N/D</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* DURANTE */}
                <div>
                  <p style={{ fontSize: 9, fontWeight: 800, textAlign: 'center', color: '#14B8D4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Durante</p>
                  <div className="space-y-1.5">
                    {photosDuring.slice(0, 2).map((url, i) => (
                      <div key={i} className="rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                    {photosDuring.length === 0 && (
                      <div className="rounded-lg flex items-center justify-center" style={{ aspectRatio: '4/3', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: 10, color: '#718096' }}>N/D</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* DEPOIS */}
                <div>
                  <p style={{ fontSize: 9, fontWeight: 800, textAlign: 'center', color: '#00D99A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Depois</p>
                  <div className="space-y-1.5">
                    {photosAfter.slice(0, 2).map((url, i) => (
                      <div key={i} className="rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                    {photosAfter.length === 0 && (
                      <div className="rounded-lg flex items-center justify-center" style={{ aspectRatio: '4/3', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: 10, color: '#718096' }}>N/D</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* DETALHES */}
                <div>
                  <p style={{ fontSize: 9, fontWeight: 800, textAlign: 'center', color: '#6D56E8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Detalhes</p>
                  <div className="grid grid-cols-2 gap-1">
                    {[...photosBefore, ...photosDuring, ...photosAfter].slice(-4).map((url, i) => (
                      <div key={i} className="rounded overflow-hidden" style={{ aspectRatio: '1', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── OBS + OCORRÊNCIAS ── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Observações */}
            <div style={S.card} className="p-4">
              <p style={{ ...S.sectionTitle, marginBottom: 10 }}>Observações</p>
              {report.observations ? (
                <div className="space-y-2">
                  {report.observations.split('\n').filter(Boolean).map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#00D99A' }} />
                      <p style={{ fontSize: 11, color: '#a0aec0' }}>{line}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 11, color: '#4A5568' }}>Nenhuma observação registrada.</p>
              )}
            </div>

            {/* Ocorrências + Condições Climáticas */}
            <div className="space-y-4">
              <div style={S.card} className="p-4">
                <p style={{ ...S.sectionTitle, marginBottom: 8 }}>Ocorrências</p>
                {report.non_conformities ? (
                  <p style={{ fontSize: 11, color: '#FC5252' }}>{report.non_conformities}</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#00D99A' }} />
                    <p style={{ fontSize: 11, color: '#00D99A' }}>Nenhuma ocorrência registrada.</p>
                  </div>
                )}
              </div>

              {report.weather_conditions && (
                <div style={S.card} className="p-4">
                  <p style={{ ...S.sectionTitle, marginBottom: 8 }}>Condições Climáticas</p>
                  <p style={{ fontSize: 11, color: '#a0aec0' }}>{report.weather_conditions}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── EQUIPAMENTOS ── */}
          {(report.equipments_snapshot || []).length > 0 && (
            <div style={S.card} className="p-4">
              <p style={{ ...S.sectionTitle, marginBottom: 10 }}>Equipamentos Utilizados</p>
              <ul className="columns-2 gap-4 space-y-1">
                {report.equipments_snapshot.map((eq, i) => (
                  <li key={i} style={{ fontSize: 11, color: '#a0aec0' }}>• {eq.name || eq.tag || eq}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ── ASSINATURAS + EXPORTAR ── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assinaturas */}
            <div style={S.card} className="p-4">
              <p style={{ ...S.sectionTitle, marginBottom: 12 }}>Assinaturas</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Supervisor Responsável', sig: report.signature_supervisor },
                  { label: 'Cliente / Fiscalização', sig: report.signature_client },
                  { label: 'Responsável Técnico',    sig: report.signature_technician },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="h-14 rounded-lg mb-1.5 flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
                      {s.sig
                        ? <img src={s.sig} alt="" className="max-h-12 max-w-full" />
                        : <span style={{ fontSize: 9, color: '#4A5568' }}>—</span>
                      }
                    </div>
                    <p style={{ fontSize: 9, color: '#718096', textAlign: 'center' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Exportar / Compartilhar */}
            <div style={S.card} className="p-4">
              <p style={{ ...S.sectionTitle, marginBottom: 12 }}>Exportar / Compartilhar</p>
              <div className="space-y-2">
                <button onClick={handlePDF}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#e2e8f0' }}>
                  <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: '#14B8D4' }} />
                  Baixar PDF
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#e2e8f0' }}>
                  <Link2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#6D56E8' }} />
                  Compartilhar Link
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#e2e8f0' }}>
                  <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: '#00D99A' }} />
                  Enviar por E-mail
                </button>
              </div>
            </div>
          </div>

          {/* ── RODAPÉ ── */}
          <div className="pt-4 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#14B8D4', letterSpacing: '0.06em' }}>
                ALTIVUS — Gestão Técnica em Altura
              </p>
              <p style={{ fontSize: 9, color: '#718096' }}>www.altivus.com.br</p>
            </div>
            <div className="text-right">
              <p style={{ fontSize: 9, color: '#718096' }}>
                Relatório gerado automaticamente pelo sistema ALTIVUS
              </p>
              <p style={{ fontSize: 9, color: '#4A5568', marginTop: 1 }}>Página 1 de 1</p>
            </div>
          </div>

        </div>

        {/* Bottom accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#14B8D4,#6D56E8,#00D99A)' }} />
      </div>
    </div>
  );
}