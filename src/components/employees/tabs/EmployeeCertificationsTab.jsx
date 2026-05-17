import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, Plus, AlertTriangle, CheckCircle2, Clock, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { format, differenceInDays } from 'date-fns';
import { employeeService } from '@/services/employeeService';


const CERT_TYPES = [
  { value: 'NR35', label: 'NR35 — Trabalho em Altura' },
  { value: 'IRATA', label: 'IRATA — International Rope Access' },
  { value: 'ANEAC', label: 'ANEAC — Acesso por Corda' },
  { value: 'espacoConfinado', label: 'Espaço Confinado (NR33)' },
  { value: 'resgate', label: 'Resgate em Altura' },
  { value: 'inspecaoEquipamentos', label: 'Inspeção de Equipamentos' },
  { value: 'primeirosAuxilios', label: 'Primeiros Auxílios' },
  { value: 'outro', label: 'Outro' },
];

function certStatus(expiry_date) {
  if (!expiry_date) return 'valid';
  const days = differenceInDays(new Date(expiry_date), new Date());
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'valid';
}

const STATUS_CONFIG = {
  valid: { label: 'Válida', color: '#00D99A', bg: 'rgba(0,217,154,0.12)', icon: CheckCircle2 },
  expiring: { label: 'Vencendo', color: '#E87D00', bg: 'rgba(232,125,0,0.12)', icon: Clock },
  expired: { label: 'Vencida', color: '#FC5252', bg: 'rgba(252,82,82,0.12)', icon: AlertTriangle },
};

const EMPTY_CERT = { id: '', type: 'NR35', name: '', issuer: '', issued_date: '', expiry_date: '', certificate_number: '', attachment_url: '', notes: '' };

export default function EmployeeCertificationsTab({ employee, db, onRefresh }) {
  const [certs, setCerts] = useState(Array.isArray(employee.certifications) ? employee.certifications : []);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSaveCerts = async (updated) => {
    setSaving(true);
    try {
      await employeeService.saveCertifications(db, employee.id, updated);
      setCerts(updated);
      setEditing(null);
      onRefresh();
      toast.success('Certificações salvas!');
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handleAdd = () => setEditing({ ...EMPTY_CERT, id: Date.now().toString() });

  const handleSaveOne = () => {
    if (!editing) return;
    const exists = certs.find(c => c.id === editing.id);
    const updated = exists
      ? certs.map(c => c.id === editing.id ? editing : c)
      : [...certs, editing];
    handleSaveCerts(updated);
  };

  const handleDelete = (certId) => {
    const updated = certs.filter(c => c.id !== certId);
    handleSaveCerts(updated);
  };

  const handleAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditing(prev => ({ ...prev, attachment_url: file_url }));
      toast.success('Anexo enviado!');
    } catch { toast.error('Erro ao enviar arquivo'); }
    setUploading(false);
  };

  const upd = (k, v) => setEditing(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Certificações & Treinamentos</h3>
          <p className="text-xs mt-0.5" style={{ color: '#718096' }}>{certs.length} certificação(ões) cadastrada(s)</p>
        </div>
        <Button size="sm" className="gap-1.5 h-8" onClick={handleAdd}>
          <Plus className="w-3.5 h-3.5" /> Nova
        </Button>
      </div>

      {/* Alertas rápidos */}
      {certs.some(c => certStatus(c.expiry_date) !== 'valid') && (
        <div className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: 'rgba(252,82,82,0.07)', border: '1px solid rgba(252,82,82,0.2)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#FC5252' }} />
          <div>
            <p className="text-xs font-bold" style={{ color: '#FC5252' }}>Atenção às certificações</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {certs.filter(c => certStatus(c.expiry_date) === 'expired').length} vencida(s) ·{' '}
              {certs.filter(c => certStatus(c.expiry_date) === 'expiring').length} vencendo em 30 dias
            </p>
          </div>
        </div>
      )}

      {/* Lista de certs */}
      {certs.length === 0 ? (
        <EmptyState label="Nenhuma certificação cadastrada" action="Nova Certificação" onAction={handleAdd} />
      ) : (
        <div className="space-y-2">
          {certs.map(cert => {
            const st = certStatus(cert.expiry_date);
            const cfg = STATUS_CONFIG[st];
            const Icon = cfg.icon;
            const days = cert.expiry_date ? differenceInDays(new Date(cert.expiry_date), new Date()) : null;
            return (
              <div key={cert.id} className="rounded-xl p-4"
                style={{
                  background: 'linear-gradient(145deg, rgba(10,16,32,0.96), rgba(6,10,22,0.98))',
                  border: `1px solid ${st !== 'valid' ? cfg.color + '30' : 'rgba(255,255,255,0.07)'}`,
                }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{cert.name || CERT_TYPES.find(t => t.value === cert.type)?.label || cert.type}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        <Icon className="w-2.5 h-2.5 inline mr-1" />{cfg.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: '#718096' }}>
                      {cert.issuer && <span>Emissor: <span className="text-white/60">{cert.issuer}</span></span>}
                      {cert.issued_date && <span>Emissão: <span className="text-white/60">{format(new Date(cert.issued_date + 'T12:00:00'), 'dd/MM/yyyy')}</span></span>}
                      {cert.expiry_date && (
                        <span style={{ color: cfg.color }}>
                          {days < 0 ? `Venceu há ${Math.abs(days)} dias` : `Vence em ${days} dias`}
                        </span>
                      )}
                      {cert.certificate_number && <span>Nº: {cert.certificate_number}</span>}
                    </div>
                    {cert.notes && <p className="text-[11px] mt-1 italic" style={{ color: '#718096' }}>{cert.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {cert.attachment_url && (
                      <a href={cert.attachment_url} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded-lg text-[10px] font-bold"
                        style={{ background: 'rgba(109,86,232,0.12)', color: '#6D56E8' }}>
                        PDF
                      </a>
                    )}
                    <button onClick={() => setEditing(cert)}
                      className="p-1.5 rounded-lg text-xs"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#A0AEC0' }}>
                      Editar
                    </button>
                    <button onClick={() => handleDelete(cert.id)}
                      className="p-1.5 rounded-lg"
                      style={{ background: 'rgba(252,82,82,0.08)', color: '#FC5252' }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal edição */}
      {editing && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ background: 'linear-gradient(145deg,rgba(8,14,30,0.99),rgba(5,10,22,1))', border: '1px solid rgba(20,184,212,0.2)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Certificação</h3>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-white/40" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Fld label="Tipo">
                <Select value={editing.type} onValueChange={v => upd('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CERT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </Fld>
              <Fld label="Nome / Descrição">
                <Input value={editing.name} onChange={e => upd('name', e.target.value)} placeholder="Nome do curso" />
              </Fld>
              <Fld label="Emissor / Instituição">
                <Input value={editing.issuer} onChange={e => upd('issuer', e.target.value)} />
              </Fld>
              <Fld label="Número Certificado">
                <Input value={editing.certificate_number} onChange={e => upd('certificate_number', e.target.value)} />
              </Fld>
              <Fld label="Data Emissão">
                <Input type="date" value={editing.issued_date} onChange={e => upd('issued_date', e.target.value)} />
              </Fld>
              <Fld label="Data Validade">
                <Input type="date" value={editing.expiry_date} onChange={e => upd('expiry_date', e.target.value)} />
              </Fld>
              <Fld label="Observações" className="col-span-2">
                <Input value={editing.notes} onChange={e => upd('notes', e.target.value)} placeholder="Observações" />
              </Fld>
            </div>
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer w-fit text-xs font-semibold"
              style={{ background: 'rgba(109,86,232,0.1)', border: '1px solid rgba(109,86,232,0.25)', color: '#6D56E8' }}>
              <Upload className="w-3.5 h-3.5" /> {uploading ? 'Enviando...' : 'Anexar PDF/Certificado'}
              <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleAttachment} disabled={uploading} />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button size="sm" onClick={handleSaveOne} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Fld({ label, children, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#718096' }}>{label}</Label>
      {children}
    </div>
  );
}

function EmptyState({ label, action, onAction }) {
  return (
    <div className="py-12 text-center rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
      <Award className="w-10 h-10 mx-auto mb-3 opacity-20" />
      <p className="text-sm text-white/30 mb-3">{label}</p>
      <Button size="sm" variant="outline" onClick={onAction}><Plus className="w-3.5 h-3.5 mr-1" />{action}</Button>
    </div>
  );
}
