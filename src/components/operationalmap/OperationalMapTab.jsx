import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/lib/useWorkspace';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { Button } from '@/components/ui/button';
import CanvasEditor from './CanvasEditor';
import MapTimeline from './MapTimeline';
import {
  Upload, Camera, Trash2, Eye,
  Loader2, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { operationalMapService } from '@/services/operationalMapService';
import { invalidateWorkspaceQueries } from '@/services/serviceUtils';

const ACCEPTED_FORMATS = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

export default function OperationalMapTab({ activity }) {
  const { workspaceId } = useWorkspace();
  const db = useWorkspaceEntities();
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [showEditor, setShowEditor] = useState(false);
  const [editingMap, setEditingMap] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Busca mapas operacionais da atividade
  const { data: maps = [] } = useQuery({
    queryKey: ['operationalMaps', workspaceId, activity?.id],
    queryFn: () => activity?.id
      ? db.OperationalMap.filter({ activity_id: activity.id })
      : Promise.resolve([]),
    enabled: !!workspaceId && !!activity?.id,
  });

  const createMapMut = useMutation({
    mutationFn: (data) => operationalMapService.createMap(db, data),
    onSuccess: () => {
      invalidateWorkspaceQueries(qc, workspaceId, [['operationalMaps', workspaceId, activity?.id]]);
      toast.success('Mapa operacional criado!');
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMapMut = useMutation({
    mutationFn: ({ id, data }) => operationalMapService.updateMap(db, id, data),
    onSuccess: () => {
      invalidateWorkspaceQueries(qc, workspaceId, [['operationalMaps', workspaceId, activity?.id]]);
      toast.success('Mapa atualizado!');
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMapMut = useMutation({
    mutationFn: (id) => operationalMapService.deleteMap(db, id),
    onSuccess: () => {
      invalidateWorkspaceQueries(qc, workspaceId, [['operationalMaps', workspaceId, activity?.id]]);
      toast.success('Mapa removido!');
    },
    onError: (e) => toast.error(e.message),
  });

  // Upload de arquivo
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_FORMATS.includes(file.type)) {
      toast.error('Formato não suportado. Use PNG, JPG, WEBP ou PDF.');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      createMapMut.mutate({
        activity_id: activity.id,
        type: 'blueprint',
        base_image_url: file_url,
        file_name: file.name,
        file_size: file.size,
        status: 'active',
        team_id: activity.team_id,
        captured_at: new Date().toISOString(),
      });
    } catch {
      toast.error('Erro ao enviar arquivo');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Câmera nativa
  const handleCameraCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      createMapMut.mutate({
        activity_id: activity.id,
        type: 'field_photo',
        base_image_url: file_url,
        file_name: file.name,
        file_size: file.size,
        status: 'active',
        team_id: activity.team_id,
        captured_at: new Date().toISOString(),
      });
    } catch {
      toast.error('Erro ao capturar foto');
    }
    setUploading(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Abre editor de anotações
  const openEditor = (map) => {
    setEditingMap(map);
    setShowEditor(true);
  };

  // Salva anotações
  const handleAnnotationSave = ({ annotations, canvasData }) => {
    updateMapMut.mutate({
      id: editingMap.id,
      data: {
        annotations,
        canvas_data: canvasData,
        status: 'active',
      },
    });
    setShowEditor(false);
    setEditingMap(null);
  };

  const hasActiveMaps = maps.filter(m => m.status !== 'archived').length > 0;

  return (
    <div className="space-y-4">
      {/* Botões de Upload */}
      <div className="flex flex-wrap gap-2">
        <label>
          <Button
            as="span"
            size="sm"
            className="gap-2 cursor-pointer"
            style={{ background: 'rgba(20,184,212,0.12)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.28)' }}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Planta / PDF
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>

        <label>
          <Button
            as="span"
            size="sm"
            className="gap-2 cursor-pointer"
            style={{ background: 'rgba(109,86,232,0.12)', color: '#6D56E8', border: '1px solid rgba(109,86,232,0.28)' }}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            Câmera
          </Button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {!hasActiveMaps && (
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.10)' }}>
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5" style={{ color: '#718096' }} />
            <div>
              <p className="text-sm font-bold text-white">Nenhum mapa operacional</p>
              <p className="text-xs text-white/40">Envie uma planta ou tire uma foto para começar</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Mapas */}
      {hasActiveMaps && (
        <div className="space-y-3">
          {maps.filter(m => m.status !== 'archived').map(map => (
            <div key={map.id} className="rounded-xl p-4"
              style={{ background: 'rgba(20,184,212,0.05)', border: '1px solid rgba(20,184,212,0.15)' }}>
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden"
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={map.base_image_url} alt="" className="w-full h-full object-cover opacity-70" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: map.type === 'field_photo' ? 'rgba(109,86,232,0.12)' : 'rgba(20,184,212,0.12)',
                        color: map.type === 'field_photo' ? '#6D56E8' : '#14B8D4',
                      }}>
                      {map.type === 'field_photo' ? '📷 Campo' : map.type === 'blueprint' ? '📐 Planta' : '✏️ Croqui'}
                    </span>
                    {(map.annotations?.length || 0) > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(0,217,154,0.12)', color: '#00D99A' }}>
                        {map.annotations.length} anotações
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 truncate">{map.file_name}</p>
                  <p className="text-[10px] text-white/30 mt-1">{new Date(map.captured_at).toLocaleString('pt-BR')}</p>
                </div>

                {/* Ações */}
                <div className="shrink-0 flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEditor(map)} className="gap-1">
                    <Eye className="w-3 h-3" /> Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMapMut.mutate(map.id)}
                    style={{ color: '#FC5252' }} className="gap-1">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Anotações preview */}
              {(map.annotations?.length || 0) > 0 && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <p className="text-[10px] text-white/40 mb-1">Anotações:</p>
                  <div className="flex flex-wrap gap-1">
                    {map.annotations.slice(0, 5).map(ann => (
                      <span key={ann.id} className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ background: ann.color + '20', color: ann.color, border: `1px solid ${ann.color}40` }}>
                        {ann.type}
                      </span>
                    ))}
                    {(map.annotations?.length || 0) > 5 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded text-white/40">
                        +{map.annotations.length - 5} mais
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <MapTimeline maps={maps} />

      {/* Editor Modal */}
      {showEditor && editingMap && (
        <CanvasEditor
          imageUrl={editingMap.base_image_url}
          initialAnnotations={editingMap.annotations || []}
          onAnnotate={handleAnnotationSave}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
