import React, { useState, useEffect, useMemo } from 'react';
import { CheckboxIcon } from './Icons';
import { ModalContent } from './Modal';

// API Configuration
const API_BASE_URL = 'https://test-smart-clear-395411569598.us-central1.run.app';

// Data structure from API
interface Alert {
  categoria: string;
  skus_potencial_obsoleto: number;
  skus_por_revisar: number;
  riesgo: 'Alto' | 'Medio' | 'Bajo';
  porcentaje_riesgo: number; // <-- AÑADE ESTA LÍNEA
}

const RiskTag = ({ risk }: { risk: Alert['riesgo'] }) => {
  let colorClasses = '';
  switch (risk) {
    case 'Alto': colorClasses = 'bg-red-100 text-red-800'; break;
    case 'Medio': colorClasses = 'bg-orange-100 text-orange-800'; break;
    case 'Bajo': colorClasses = 'bg-green-100 text-green-800'; break;
    default: colorClasses = 'bg-gray-100 text-gray-800';
  }
  return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${colorClasses}`}>{risk}</span>;
};

export const Alertas = ({ openModal, closeModal }: { openModal: (content: ModalContent) => void; closeModal: () => void; }) => {
  // State for data and UI
  const [masterAlertList, setMasterAlertList] = useState<Alert[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<string>('Todos');

  // Fetch data on component mount
  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/alertas`);
        if (!response.ok) {
          throw new Error('No se pudo conectar con el servidor.');
        }
        const data: Alert[] = await response.json();
        setMasterAlertList(data);
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error al cargar las alertas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  // Client-side filtering logic
  const filteredAlerts = useMemo(() => {
    if (selectedRisk === 'Todos') {
      return masterAlertList;
    }
    return masterAlertList.filter(alert => alert.riesgo === selectedRisk);
  }, [masterAlertList, selectedRisk]);

  // Selection logic
  const handleSelect = (category: string) => {
    setSelected(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const isAllSelected = useMemo(() => 
    filteredAlerts.length > 0 && filteredAlerts.every(item => selected.includes(item.categoria)),
    [filteredAlerts, selected]
  );
  
  const handleSelectAll = () => {
    const filteredCategories = filteredAlerts.map(item => item.categoria);
    if (isAllSelected) {
      setSelected(prev => prev.filter(c => !filteredCategories.includes(c)));
    } else {
      setSelected(prev => [...new Set([...prev, ...filteredCategories])]);
    }
  };

  // Action handler
  const handleAlert = async () => {
    setIsSending(true);
    const alertsToSend = masterAlertList.filter(item => selected.includes(item.categoria));

    const promises = alertsToSend.map(item => {
        const payload = {
            categoria: item.categoria,
            riesgo: item.riesgo,
            skus_potenciales: item.skus_potencial_obsoleto,
        };
        return fetch(`${API_BASE_URL}/enviar-alerta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    });

    const results = await Promise.allSettled(promises);
    setIsSending(false);

    const successfulCount = results.filter(res => res.status === 'fulfilled' && res.value.ok).length;

    if (successfulCount === selected.length) {
        openModal({
            type: 'success',
            title: 'Alerta Enviada',
            body: `Se envió la alerta para ${selected.length} categoría(s) seleccionada(s) a los correos de los Category Managers correspondientes.`,
            primaryActionText: 'OK',
            onPrimaryAction: () => {
                setSelected([]);
                closeModal();
            },
        });
    } else {
        const failedCount = selected.length - successfulCount;
        openModal({
            type: 'confirm',
            title: 'Error al Enviar Alertas',
            body: `No se pudieron enviar ${failedCount} de ${selected.length} alertas. Por favor, inténtelo de nuevo.`,
            primaryActionText: 'OK',
            onPrimaryAction: closeModal,
        });
    }
  };
  
  const renderTableBody = () => {
      if (isLoading) {
          return (
              <tr>
                  <td colSpan={5} className="text-center p-8 text-gray-500">Cargando alertas...</td>
              </tr>
          );
      }
      if (error) {
          return (
              <tr>
                  <td colSpan={5} className="text-center p-8 text-red-600 font-semibold">{error}</td>
              </tr>
          );
      }
      if (filteredAlerts.length === 0) {
          return (
               <tr>
                  <td colSpan={5} className="text-center p-8 text-gray-500">No se encontraron alertas para el filtro seleccionado.</td>
              </tr>
          );
      }
      return (
          filteredAlerts.map((item) => (
            <tr key={item.categoria} className="border-b border-[#ECF0F1] hover:bg-gray-50">
              <td className="p-4">
                <div onClick={() => handleSelect(item.categoria)} className="cursor-pointer">
                  <CheckboxIcon checked={selected.includes(item.categoria)} />
                </div>
              </td>
              <td className="p-4 text-[#34495E] font-medium">{item.categoria}</td>
                <td className="p-4 text-center text-[#34495E]">
                  {/* Muestra el número principal (Potencial) en grande */}
                <div className="font-semibold">{item.skus_potencial_obsoleto}</div>
                  {/* Muestra el número secundario (Por Revisar) como subtítulo */}
                <div className="text-xs text-gray-500">(Por Revisar: {item.skus_por_revisar})</div>
              </td>
              <td className="p-4 text-center text-[#34495E] font-medium">
                {(item.porcentaje_riesgo * 100).toFixed(1)}%
              </td>
              <td className="p-4"><RiskTag risk={item.riesgo} /></td>
            </tr>
          ))
      );
  };

return (
    <div className="space-y-6">
      
      {/* --- INICIO DE LA MODIFICACIÓN --- */}

      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-[#ECF0F1]">
        <div className="flex items-center space-x-4">
            <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="border border-[#ECF0F1] rounded-md px-3 py-2 text-[#34495E] focus:outline-none focus:ring-2 focus:ring-[#D9534F]/50"
            >
                <option value="Todos">Filtrar por Riesgo: Todos</option>
                <option value="Alto">Alto</option>
                <option value="Medio">Medio</option>
                <option value="Bajo">Bajo</option>
            </select>
        </div>
        
        {/* 1. MOVEMOS EL BOTÓN AQUÍ y lo alineamos a la derecha */}
        <button
                disabled={selected.length === 0 || isSending}
                onClick={handleAlert}
                className="px-4 py-2 text-white font-semibold rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed bg-[#D9534F] hover:bg-[#C0392B]">
                
              {/* 2. CAMBIAMOS EL TEXTO PARA QUE SEA DINÁMICO */}
              {isSending 
                ? 'Enviando...' 
                : (selected.length > 0 ? `Alertar a (${selected.length}) Categorías` : 'Seleccione categorías')
              }
            </button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-[#ECF0F1]">
        
        {/* 3. BORRAMOS EL DIV QUE CONTENÍA EL BOTÓN */}
        {/* <div className="flex justify-end items-center mb-4"> ... BOTÓN BORRADO ... </div> */}

        <div className="overflow-x-auto">
      {/* --- FIN DE LA MODIFICACIÓN --- */}
          <table className="w-full text-left">
            <thead className="border-b-2 border-[#ECF0F1]">
              <tr>
                <th className="p-4 w-12">
                   <div onClick={handleSelectAll} className="cursor-pointer">
                      <CheckboxIcon checked={isAllSelected} />
                    </div>
                </th>
                <th className="p-4 text-[#34495E] font-bold">CATEGORÍA</th>
                <th className="p-4 text-center text-[#34495E] font-bold">SKUs AFECTADOS</th>
                <th className="p-4 text-center text-[#34495E] font-bold">% SKUS EN RIESGO</th>
                <th className="p-4 text-[#34495E] font-bold">RIESGO</th>
              </tr>
            </thead>
            <tbody>
              {renderTableBody()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};