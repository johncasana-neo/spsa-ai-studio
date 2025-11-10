import React, { useState, useEffect } from 'react';

// --- Constants & Config ---
const API_BASE_URL = 'https://test-smart-clear-395411569598.us-central1.run.app';

// --- Interfaces ---
interface KpiData {
  valor_en_riesgo: number;
  capital_en_liquidacion: number;
  skus_accion_requerida: number;
  capital_recuperado_total: number;
}

interface SaludGlobalItem {
  name: string;
  value: number;
}

interface TopRiesgoItem {
  categoria: string;
  valor: number;
}

interface InicioChartData {
  salud_global: SaludGlobalItem[];
  top_riesgo_categoria: TopRiesgoItem[];
}

interface AlertData {
  categoria: string;
  skus_potencial_obsoleto: number;
  skus_por_revisar: number;
  riesgo: 'Alto' | 'Medio' | 'Bajo';
}

interface DashboardProps {
  setActiveView: (view: string) => void;
  setInitialObsoletosFilter: (filter: string | null) => void;
}

// --- Helper Functions & Sub-components ---
const formatCurrency = (value: number): string => {
  // Maneja valores nulos o indefinidos
  if (value === null || typeof value === 'undefined') {
    return 'S/ 0';
  }

  // Billones (Trillions - 12 ceros)
  if (Math.abs(value) >= 1_000_000_000_000) {
    return `S/ ${(value / 1_000_000_000_000).toFixed(1)} B`; 
  }
  // Mil Millones (Billions - 9 ceros)
  if (Math.abs(value) >= 1_000_000_000) {
    return `S/ ${(value / 1_000_000_000).toFixed(1)} MM`;
  }
  // Millones (6 ceros)
  if (Math.abs(value) >= 1_000_000) {
    return `S/ ${(value / 1_000_000).toFixed(1)} M`;
  }
  // Miles (3 ceros)
  if (Math.abs(value) >= 10_000) { // Empezamos a abreviar desde 10k
    return `S/ ${(value / 1_000).toFixed(0)} k`;
  }
  
  // Para valores menores (ej. 5,072), usa tu formato original
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const KpiCard: React.FC<{ 
  title: string; 
  value: string; 
  subtitle: string; 
  color: 'red' | 'orange' | 'blue' | 'green'; 
  onClick?: () => void; 
  tooltipText?: string; // <-- 1. AÑADE ESTA PROP
}> = ({ title, value, subtitle, color, onClick, tooltipText }) => {
  const colors = {
    red: 'border-red-500 text-red-500',
    orange: 'border-orange-500 text-orange-500',
    blue: 'border-blue-500 text-blue-500',
    green: 'border-green-500 text-green-500',
  };
  const cursorClass = onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : '';

  return (
    <div className={`p-6 bg-white rounded-xl border-l-4 ${colors[color]} shadow-md transition-all duration-300 ${cursorClass}`} onClick={onClick}>
      
      {/* --- INICIO DE LA MODIFICACIÓN --- */}
      {/* 2. Añadimos 'group relative' y envolvemos el título */}
      <div className="flex items-center space-x-1 group relative">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {tooltipText && (
          <>
            <div className="cursor-help">
              <InfoIcon />
            </div>
            {/* 3. Este es el tooltip CSS-only */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 whitespace-normal">
              {tooltipText}
            </div>
          </>
        )}
      </div>
      {/* --- FIN DE LA MODIFICACIÓN --- */}

      <p className={`text-3xl font-bold mt-2 ${colors[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
    </div>
  );
};

const DonutChart: React.FC<{ data: SaludGlobalItem[] }> = ({ data }) => {
    
    const colorMap: { [key: string]: string } = {
      'Inventario Saludable': '#34D399', // Verde
      'Inventario en Riesgo': '#EF4444', // Rojo
      // Los otros colores ya no se usarán, pero no hace daño dejarlos
      'En Liquidación': '#F59E0B', 
      'Pendiente de Aprobación': '#3B82F6', 
      'Otro': '#9CA3AF' 
    };

    // --- INICIO DE LA MODIFICACIÓN ---
    // 1. Filtramos los datos para incluir SOLO las dos categorías principales
    const filteredData = data.filter(item => 
      item.name === 'Inventario Saludable' || item.name === 'Inventario en Riesgo'
    );
    // --- FIN DE LA MODIFICACIÓN ---

    // 2. El total ahora se basa solo en los datos filtrados
    const total = filteredData.reduce((acc, item) => acc + item.value, 0);

    if (total === 0) return <div className="flex items-center justify-center h-full text-gray-500">No hay datos para mostrar</div>;

    let accumulatedPercentage = 0;
    
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                {/* 3. Mapeamos sobre los datos FILTRADOS */}
                    {filteredData.map((item, index) => {
                        const percentage = (item.value / total) * 100;
                        const strokeDasharray = `${percentage} ${100 - percentage}`;
                        const strokeDashoffset = -accumulatedPercentage;
                        accumulatedPercentage += percentage;
                        const color = colorMap[item.name] || colorMap['Otro'];
                        
                        return (
                            <circle
                                key={item.name}
                                cx="18"
                                cy="18"
                                r="15.9155"
                                fill="transparent"
                                stroke={color}
                                strokeWidth="3"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                transform="rotate(-90 18 18)"
                            >
                              <title>{`${item.name}: ${formatCurrency(item.value)}`}</title>
                 </circle>
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* 4. El total del centro sigue siendo el total real (1.8 B) */}
                    <span className="text-2xl font-bold text-gray-800">{formatCurrency(data.reduce((acc, item) => acc + item.value, 0))}</span>
                    <span className="text-xs text-gray-500">Total</span>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
              {/* 5. Mapeamos sobre los datos FILTRADOS para la leyenda */}
                {filteredData.map((item, index) => {
                    const color = colorMap[item.name] || colorMap['Otro'];
                    return (
                    <div key={item.name} className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></span>
                   <span>{item.name}</span>
                    </div>
                    );
                })}
            </div>
     </div>
    );
};

const HorizontalBarChart: React.FC<{ data: TopRiesgoItem[] }> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No hay datos de riesgo para mostrar</div>;
    }
    const maxValue = Math.max(...data.map(item => item.valor), 1);
    
    return (
        <div className="space-y-3 h-full flex flex-col justify-center">
            {data.map(item => (
                <div key={item.categoria} className="w-full">
                    <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-medium text-gray-600 truncate">{item.categoria}</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(item.valor)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-red-500 h-2.5 rounded-full"
                            style={{ width: `${(item.valor / maxValue) * 100}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const RiskBadge: React.FC<{ risk: AlertData['riesgo'] }> = ({ risk }) => {
    const colors = {
      Alto: 'bg-red-100 text-red-800',
      Medio: 'bg-orange-100 text-orange-800',
      Bajo: 'bg-green-100 text-green-800',
    };
    return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${colors[risk]}`}>{risk}</span>;
};

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 group-hover:text-gray-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

// --- Main Component ---
export const Dashboard: React.FC<DashboardProps> = ({ setActiveView, setInitialObsoletosFilter }) => {
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [chartData, setChartData] = useState<InicioChartData | null>(null);
  const [alertData, setAlertData] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [kpiRes, chartRes, alertRes] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard-kpis`),
          fetch(`${API_BASE_URL}/inicio-charts`),
          fetch(`${API_BASE_URL}/alertas?limit=10`),
        ]);

        if (!kpiRes.ok || !chartRes.ok || !alertRes.ok) {
          throw new Error('No se pudo conectar con el servidor para cargar el dashboard.');
        }

        const kpiJson = await kpiRes.json();
        const chartJson = await chartRes.json();
        const alertJson = await alertRes.json();

        setKpiData(kpiJson);
        setChartData(chartJson);
        setAlertData(Array.isArray(alertJson) ? alertJson : []);

      } catch (err: any) {
        setError(err.message || 'Ocurrió un error inesperado.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAlertRowClick = (category: string) => {
    setInitialObsoletosFilter(category);
    setActiveView('Gestión de Obsoletos');
  };

  if (loading) {
    return <div className="text-center p-10 font-semibold text-gray-600">Cargando dashboard de mando...</div>;
  }
  if (error) {
    return <div className="text-center p-10 text-red-600 font-semibold">{error}</div>;
  }

  return (
    <div className="w-full space-y-8">

      {/* --- INICIO: TÍTULO DE BIENVENIDA --- */}
      <div className="text-center mb-4"> {/* Añadimos mb-4 para separarlo del párrafo de abajo */}
        <h2 className="text-4xl font-bold text-gray-800">
          Bienvenido a <span className="text-red-600">Smart Clear IA</span>
        </h2>
        <p className="text-lg text-gray-600 mt-2 max-w-3xl mx-auto">
          La solución inteligente para la gestión de inventario y optimización de precios. Transforme el sobrestock en oportunidades de venta con el poder de la inteligencia artificial.
        </p>
      </div>
      {/* --- FIN: TÍTULO DE BIENVENIDA --- */}
      <hr className="my-8 border-gray-200" />
      {/* Section 1: KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData && (
          <>
          <KpiCard 
                        title="Valor en Riesgo (Potencial)" 
                        value={formatCurrency(kpiData.valor_en_riesgo)} 
                        subtitle="Inventario 'activo' con riesgo" 
                        color="red" 
                        tooltipText="Suma del valor (Stock * Precio) de todo el inventario 'Activo' que cumple las reglas de obsoleto (Ej: >120 días)."
                      />
                      <KpiCard 
                        title="Capital en Liquidación (Actual)" 
                        value={formatCurrency(kpiData.capital_en_liquidacion)} 
                        subtitle="Valor de stock actual en descuento" 
                        color="orange" 
                        tooltipText="Suma del valor del stock restante que ya se encuentra en estado 'Descuento' (en proceso de liquidación)."
                      />
                      <KpiCard 
                        title="Acción Requerida" 
                        value={`${kpiData.skus_accion_requerida} SKUs`} 
                        subtitle="En 'Gestión de Descuentos'" 
                        color="blue" 
                        onClick={() => setActiveView('Gestión de Descuentos')}
                        tooltipText="SKUs en estado 'Pendiente de Descuento' que esperan aprobación en la pestaña 'Gestión de Descuentos'."
                      />
                      <KpiCard 
                        title="Capital Recuperado (Total)" 
                        value={formatCurrency(kpiData.capital_recuperado_total)} 
                        subtitle="Ventas recuperadas de liquidaciones" 
                        color="green"
                        tooltipText="Suma del valor (Ventas * Precio) de todos los productos que ya se han vendido como parte de una liquidación."
                      />
                    </>
                  )}
      </div>

      {/* Section 2: Charts */}
      <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h4 className="font-bold text-[#34495E] mb-4 text-center">Salud Global del Inventario</h4>
            {chartData?.salud_global ? <DonutChart data={chartData.salud_global} /> : <div className="h-full flex items-center justify-center text-gray-400">Cargando...</div>}
          </div>
          <div className="w-full lg:w-2/3 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h4 className="font-bold text-[#34495E] mb-4">Top 5 Categorías con Capital en Riesgo</h4>
            {chartData?.top_riesgo_categoria ? <HorizontalBarChart data={chartData.top_riesgo_categoria} /> : <div className="h-full flex items-center justify-center text-gray-400">Cargando...</div>}
          </div>
      </div>
      
      {/* Section 3: Urgent Actions Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold text-[#34495E] mb-4">Acciones Urgentes (Resumen de Alertas)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b-2 border-gray-200 bg-gray-50">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                  <div className="flex items-center justify-center space-x-1 group relative">
                    <span>SKUs Potencial a Obsoletos</span>
                    <div className="cursor-help">
                      <InfoIcon />
                    </div>
                    {/* --- MODIFICACIÓN AQUÍ --- */}
                    <div className="absolute top-full left-0 mt-2 w-72 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 whitespace-normal">
                      SKUs en estado 'Activo' que cumplen la regla de obsoleto (Ej: >120 días de inventario) y necesitan ser revisados.
                    </div>
                  </div>
                </th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">SKUs con Descuento por Revisar</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Riesgo</th>
              </tr>
            </thead>
            <tbody>
              {alertData.length > 0 ? alertData.map(item => (
                <tr key={item.categoria} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => handleAlertRowClick(item.categoria)}>
                  <td className="p-4 font-medium text-[#34495E]">{item.categoria}</td>
                  <td className="p-4 text-gray-600 text-center">{item.skus_potencial_obsoleto}</td>
                  <td className="p-4 text-gray-600 text-center">{item.skus_por_revisar}</td>
                  <td className="p-4"><RiskBadge risk={item.riesgo} /></td>
                </tr>
              )) : (
                 <tr>
                    <td colSpan={4} className="text-center p-8 text-gray-500">No hay alertas urgentes por el momento.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};