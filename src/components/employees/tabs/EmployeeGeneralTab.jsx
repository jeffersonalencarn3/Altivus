import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, User, Phone, Heart, Users } from 'lucide-react';
import { toast } from 'sonner';
import { employeeService } from '@/services/employeeService';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function EmployeeGeneralTab({ employee, db, onRefresh }) {
  const [form, setForm] = useState({
    name: employee.name || '',
    role: employee.role || '',
    phone: employee.phone || '',
    email: employee.email || '',
    cpf: employee.cpf || '',
    rg: employee.rg || '',
    birth_date: employee.birth_date || '',
    admission_date: employee.admission_date || '',
    blood_type: employee.blood_type || '',
    emergency_contact: employee.emergency_contact || '',
    emergency_phone: employee.emergency_phone || '',
    address: employee.address || '',
    notes: employee.notes || '',
    nr35_level: employee.nr35_level || '',
    irata_level: employee.irata_level || '',
    status: employee.status || 'active',
  });
  const [saving, setSaving] = useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await employeeService.updateEmployee(db, employee.id, form);
      toast.success('Dados salvos!');
      onRefresh();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#718096' }}>{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Identificação */}
      <Section title="Identificação" icon={User}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome Completo">
            <Input value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Nome" />
          </Field>
          <Field label="Função / Cargo">
            <Input value={form.role} onChange={e => upd('role', e.target.value)} placeholder="Ex: Alpinista Industrial" />
          </Field>
          <Field label="CPF">
            <Input value={form.cpf} onChange={e => upd('cpf', e.target.value)} placeholder="000.000.000-00" />
          </Field>
          <Field label="RG">
            <Input value={form.rg} onChange={e => upd('rg', e.target.value)} placeholder="RG" />
          </Field>
          <Field label="Data de Nascimento">
            <Input type="date" value={form.birth_date} onChange={e => upd('birth_date', e.target.value)} />
          </Field>
          <Field label="Admissão">
            <Input type="date" value={form.admission_date} onChange={e => upd('admission_date', e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={v => upd('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tipo Sanguíneo">
            <Select value={form.blood_type} onValueChange={v => upd('blood_type', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {BLOOD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      {/* Habilitações NR/IRATA */}
      <Section title="Habilitações Técnicas" icon={Users}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nível NR35">
            <Select value={form.nr35_level} onValueChange={v => upd('nr35_level', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Não habilitado</SelectItem>
                <SelectItem value="basico">Básico</SelectItem>
                <SelectItem value="avancado">Avançado</SelectItem>
                <SelectItem value="supervisor">Supervisor N3</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nível IRATA">
            <Select value={form.irata_level} onValueChange={v => upd('irata_level', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Não certificado</SelectItem>
                <SelectItem value="1">Nível 1 — Técnico</SelectItem>
                <SelectItem value="2">Nível 2 — Supervisor</SelectItem>
                <SelectItem value="3">Nível 3 — Inspetor</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      {/* Contato */}
      <Section title="Contato" icon={Phone}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Telefone">
            <Input value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="(00) 00000-0000" />
          </Field>
          <Field label="E-mail">
            <Input value={form.email} onChange={e => upd('email', e.target.value)} placeholder="email@empresa.com" />
          </Field>
          <Field label="Endereço">
            <Input value={form.address} onChange={e => upd('address', e.target.value)} placeholder="Endereço completo" />
          </Field>
        </div>
      </Section>

      {/* Emergência */}
      <Section title="Contato de Emergência" icon={Heart}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome do Contato">
            <Input value={form.emergency_contact} onChange={e => upd('emergency_contact', e.target.value)} placeholder="Nome" />
          </Field>
          <Field label="Telefone de Emergência">
            <Input value={form.emergency_phone} onChange={e => upd('emergency_phone', e.target.value)} placeholder="(00) 00000-0000" />
          </Field>
        </div>
      </Section>

      <Button className="w-full sm:w-auto gap-2" onClick={handleSave} disabled={saving}>
        <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Dados'}
      </Button>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl p-4 space-y-4"
      style={{
        background: 'linear-gradient(145deg, rgba(10,16,32,0.96), rgba(6,10,22,0.98))',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
      <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Icon className="w-4 h-4" style={{ color: '#14B8D4' }} />
        <span className="text-sm font-bold text-white">{title}</span>
      </div>
      {children}
    </div>
  );
}
