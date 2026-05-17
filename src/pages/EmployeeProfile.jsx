/**
 * PRONTUÁRIO OPERACIONAL DIGITAL — ALTIVUS
 * Perfil completo do colaborador com rastreabilidade total
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { useEquipments, useInspections, useChecklists } from '@/lib/useAppData';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, User, Award, Package, Shield, ClipboardCheck,
  Clock, FlaskConical, Brain, BarChart2, FileText,
  AlertTriangle, Camera
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Tab Components
import EmployeeGeneralTab from '@/components/employees/tabs/EmployeeGeneralTab';
import EmployeeCertificationsTab from '@/components/employees/tabs/EmployeeCertificationsTab';
import EmployeeEquipmentsTab from '@/components/employees/tabs/EmployeeEquipmentsTab';
import EmployeeInspectionsTab from '@/components/employees/tabs/EmployeeInspectionsTab';
import EmployeeChecklistTab from '@/components/employees/tabs/EmployeeChecklistTab';
import EmployeeHistoryTab from '@/components/employees/tabs/EmployeeHistoryTab';
import EmployeeChemicalTab from '@/components/employees/tabs/EmployeeChemicalTab';
import EmployeeAITab from '@/components/employees/tabs/EmployeeAITab';
import EmployeeTimelineTab from '@/components/employees/tabs/EmployeeTimelineTab';
import EmployeePDFExport from '@/components/employees/EmployeePDFExport';
import { employeeService } from '@/services/employeeService';
import { invalidateWorkspaceQueries } from '@/services/serviceUtils';

const TABS = [
  { id: 'geral', label: 'Dados Gerais', icon: User },
  { id: 'certificacoes', label: 'Certificações', icon: Award },
  { id: 'equipamentos', label: 'Equipamentos', icon: Package },
  { id: 'inspecoes', label: 'Inspeções', icon: Shield },
  { id: 'checklists', label: 'Checklists', icon: ClipboardCheck },
  { id: 'historico', label: 'Histórico Operacional', icon: Clock },
  { id: 'quimica', label: 'Exposição Química', icon: FlaskConical },
  { id: 'ia', label: 'IA Especialista', icon: Brain },
  { id: 'timeline', label: 'Timeline', icon: BarChart2 },
  { id: 'relatorios', label: 'Relatórios PDF', icon: FileText },
];

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const db = useWorkspaceEntities();
  const { workspaceId } = useWorkspace();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('geral');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', workspaceId, id],
    queryFn: () => db.Employee.get(id),
    enabled: !!id,
  });

  const { data: equipments = [] } = useEquipments(id);
  const { data: inspections = [] } = useInspections(id);
  const { data: checklists = [] } = useChecklists(id);

  const invalidate = () => {
    invalidateWorkspaceQueries(qc, workspaceId, [
      ['employee', workspaceId, id],
      ['equipments', workspaceId, id],
      ['inspections', workspaceId, id],
      ['checklists', workspaceId, id],
      'employees',
    ]);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await employeeService.updateEmployee(db, id, { photo_url: file_url });
      invalidate();
      toast.success('Foto atualizada!');
    } catch { toast.error('Erro ao enviar foto'); }
    setUploadingPhoto(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40">Colaborador não encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/registers')} className="mt-4">Voltar</Button>
      </div>
    );
  }

  // Calcular alertas rápidos
  const certs = Array.isArray(employee.certifications) ? employee.certifications : [];
  const certExpiring = certs.filter(c => {
    if (!c.expiry_date) return false;
    const days = (new Date(c.expiry_date) - new Date()) / 86400000;
    return days >= 0 && days <= 30;
  }).length;
  const certExpired = certs.filter(c => {
    if (!c.expiry_date) return false;
    return new Date(c.expiry_date) < new Date();
  }).length;
  const eqBlocked = equipments.filter(e => e.status === 'bloqueado' || e.status === 'revisao_n3').length;
  const inspPending = equipments.filter(e => {
    if (!e.next_inspection_date) return false;
    return new Date(e.next_inspection_date) <= new Date();
  }).length;

  const alertCount = certExpiring + certExpired + eqBlocked + inspPending;

  const statusColors = { active: '#00D99A', inactive: '#718096', suspended: '#FC5252' };
  const statusLabels = { active: 'Ativo', inactive: 'Inativo', suspended: 'Suspenso' };

  const tabProps = { employee, equipments, inspections, checklists, db, workspaceId, onRefresh: invalidate };

  return (
    <div className="space-y-0 -mt-1">
      {/* Header do prontuário */}
      <div className="rounded-2xl overflow-hidden mb-4"
        style={{
          background: 'linear-gradient(145deg, rgba(10,16,32,0.96) 0%, rgba(6,10,22,0.98) 100%)',
          border: '1px solid rgba(20,184,212,0.15)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}>
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(20,184,212,0.04)' }}>
          <button onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#14B8D4' }}>
            PRONTUÁRIO OPERACIONAL DIGITAL
          </span>
          {alertCount > 0 && (
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(252,82,82,0.12)', border: '1px solid rgba(252,82,82,0.3)' }}>
              <AlertTriangle className="w-3 h-3" style={{ color: '#FC5252' }} />
              <span className="text-[10px] font-bold" style={{ color: '#FC5252' }}>{alertCount} alerta{alertCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Employee identity */}
        <div className="p-5 flex items-start gap-5">
          {/* Avatar / Photo */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden"
              style={{
                border: `2px solid ${statusColors[employee.status] || '#718096'}40`,
                boxShadow: `0 0 20px ${statusColors[employee.status] || '#718096'}20`,
                background: 'rgba(255,255,255,0.04)',
              }}>
              {employee.photo_url ? (
                <img src={employee.photo_url} alt={employee.name}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black"
                  style={{ color: '#14B8D4', background: 'rgba(20,184,212,0.08)' }}>
                  {employee.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ background: 'rgba(20,184,212,0.9)', border: '2px solid rgba(10,16,32,1)' }}>
              <Camera className="w-3 h-3 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-white truncate">{employee.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: `${statusColors[employee.status] || '#718096'}15`,
                  color: statusColors[employee.status] || '#718096',
                  border: `1px solid ${statusColors[employee.status] || '#718096'}30`,
                }}>
                {statusLabels[employee.status] || employee.status}
              </span>
            </div>
            <p className="text-sm font-medium mb-2" style={{ color: '#14B8D4' }}>{employee.role || 'Sem função definida'}</p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3">
              {employee.nr35_level && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(109,86,232,0.12)', color: '#6D56E8', border: '1px solid rgba(109,86,232,0.2)' }}>
                  NR35 {employee.nr35_level.toUpperCase()}
                </span>
              )}
              {employee.irata_level && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(20,184,212,0.12)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.2)' }}>
                  IRATA Nível {employee.irata_level}
                </span>
              )}
              {certExpired > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(252,82,82,0.12)', color: '#FC5252', border: '1px solid rgba(252,82,82,0.2)' }}>
                  {certExpired} cert. vencida{certExpired > 1 ? 's' : ''}
                </span>
              )}
              {certExpiring > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(232,125,0,0.12)', color: '#E87D00', border: '1px solid rgba(232,125,0,0.2)' }}>
                  {certExpiring} vencendo
                </span>
              )}
            </div>
          </div>

          {/* Score operacional */}
          <div className="shrink-0 text-center hidden sm:block">
            <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(20,184,212,0.1), rgba(109,86,232,0.1))',
                border: '1px solid rgba(20,184,212,0.2)',
              }}>
              <span className="text-lg font-black" style={{ color: '#14B8D4' }}>{employee.operational_score ?? 100}</span>
              <span className="text-[8px] font-bold" style={{ color: '#718096' }}>SCORE</span>
            </div>
            <Button size="sm" className="mt-2 gap-1 h-7 text-xs" onClick={() => setActiveTab('relatorios')}
              style={{ background: 'rgba(109,86,232,0.15)', border: '1px solid rgba(109,86,232,0.3)', color: '#6D56E8' }}>
              <FileText className="w-3 h-3" /> PDF
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-3 pb-3 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
                  style={isActive
                    ? { background: 'rgba(20,184,212,0.15)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.3)' }
                    : { background: 'rgba(255,255,255,0.03)', color: '#718096', border: '1px solid rgba(255,255,255,0.06)' }
                  }>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="page-enter">
        {activeTab === 'geral' && <EmployeeGeneralTab {...tabProps} />}
        {activeTab === 'certificacoes' && <EmployeeCertificationsTab {...tabProps} />}
        {activeTab === 'equipamentos' && <EmployeeEquipmentsTab {...tabProps} />}
        {activeTab === 'inspecoes' && <EmployeeInspectionsTab {...tabProps} />}
        {activeTab === 'checklists' && <EmployeeChecklistTab {...tabProps} />}
        {activeTab === 'historico' && <EmployeeHistoryTab {...tabProps} />}
        {activeTab === 'quimica' && <EmployeeChemicalTab {...tabProps} />}
        {activeTab === 'ia' && <EmployeeAITab {...tabProps} />}
        {activeTab === 'timeline' && <EmployeeTimelineTab {...tabProps} />}
        {activeTab === 'relatorios' && <EmployeePDFExport {...tabProps} />}
      </div>

      {/* AI Legal Banner */}
      <div className="mt-4 px-4 py-2.5 rounded-xl flex items-center gap-2"
        style={{ background: 'rgba(109,86,232,0.06)', border: '1px solid rgba(109,86,232,0.15)' }}>
        <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: '#6D56E8' }} />
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <span className="font-bold" style={{ color: '#6D56E8' }}>Aviso Legal: </span>
          A IA auxilia tecnicamente e não substitui inspeção formal, fabricante, Supervisor N3 ou responsável técnico. Somente Supervisor N3 ou inspetor autorizado pode reprovar, condenar ou bloquear equipamentos.
        </p>
      </div>
    </div>
  );
}
