import React, { useState } from 'react';
import { useActivityMaterials, useMaterials } from '@/lib/useAppData';
import { useMaterialServiceMutations } from '@/hooks/services/useMaterialServiceMutations';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertTriangle, Package } from 'lucide-react';

const TYPE_LABELS = { epi: 'EPI', ferramenta: 'Ferramenta', consumivel: 'Consumível' };
const TYPE_COLORS = {
  epi: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  ferramenta: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  consumivel: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
};

export default function MaterialsPanel({ activityId }) {
  const { data: usedMaterials = [] } = useActivityMaterials(activityId);
  const { data: allMaterials = [] } = useMaterials();
  const { addToActivity, removeFromActivity } = useMaterialServiceMutations();

  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');

  const selectedMaterial = allMaterials.find(m => m.id === selectedMaterialId);

  const handleAdd = () => {
    setError('');
    const quantity = Number(qty);
    if (!selectedMaterialId || !quantity || quantity <= 0) {
      setError('Selecione um material e informe uma quantidade válida.');
      return;
    }
    if (selectedMaterial && quantity > (selectedMaterial.quantity_available || 0)) {
      setError(`Estoque insuficiente. Disponível: ${selectedMaterial.quantity_available} ${selectedMaterial.unit}`);
      return;
    }
    const material = allMaterials.find(m => m.id === selectedMaterialId);
    addToActivity.mutate({ activityId, material, quantity }, {
      onSuccess: () => {
        setSelectedMaterialId('');
        setQty('');
        setError('');
      },
      onError: (_, message) => setError(message),
    });
  };

  const getMaterialInfo = (materialId) => allMaterials.find(m => m.id === materialId);

  const isCritical = (m) => m && (m.quantity_available || 0) <= (m.low_stock_threshold || 5);

  return (
    <div className="space-y-4">
      {/* Add row */}
      <div className="flex gap-2 items-start flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Selecione material..." />
            </SelectTrigger>
            <SelectContent>
              {allMaterials.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <span>{m.name}</span>
                    <span className="text-muted-foreground text-[10px]">({m.quantity_available} {m.unit})</span>
                    {isCritical(m) && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedMaterial && (
            <p className="text-[10px] text-muted-foreground mt-1 ml-1">
              Disponível: <span className={isCritical(selectedMaterial) ? 'text-amber-500 font-semibold' : 'text-foreground font-medium'}>
                {selectedMaterial.quantity_available} {selectedMaterial.unit}
              </span>
            </p>
          )}
        </div>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Qtd"
          value={qty}
          onChange={e => setQty(e.target.value)}
          className="w-24 h-9 text-xs"
        />
        <Button size="sm" className="h-9" onClick={handleAdd} disabled={addToActivity.isPending}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {error}
        </p>
      )}

      {/* Used materials list */}
      {usedMaterials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-xs gap-2">
          <Package className="w-6 h-6 opacity-40" />
          <span>Nenhum material registrado nesta atividade</span>
        </div>
      ) : (
        <div className="space-y-2">
          {usedMaterials.map(record => {
            const mat = getMaterialInfo(record.material_id);
            if (!mat) return null;
            const critical = isCritical(mat);
            return (
              <div key={record.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/20 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${TYPE_COLORS[mat.type]}`}>
                    {TYPE_LABELS[mat.type]}
                  </Badge>
                  <span className="text-sm font-medium truncate">{mat.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-semibold">{record.quantity_used} {mat.unit}</p>
                    <p className={`text-[10px] flex items-center gap-1 ${critical ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {critical && <AlertTriangle className="w-2.5 h-2.5" />}
                      Saldo: {mat.quantity_available} {mat.unit}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeFromActivity.mutate(record)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
