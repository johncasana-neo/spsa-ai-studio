

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CheckboxIcon, DownloadIcon, SearchIcon, InboxIcon } from './Icons';
import { ModalContent } from './Modal';

const API_BASE_URL = 'https://test-smart-clear-395411569598.us-central1.run.app';

type Status = 'Alertar' | 'Mantener' | 'Oportunidad';

interface Product {
  producto: string;
  skuId: string;
  meta_venta: string;
  avance_actual: string;
  sell_through: string;
  descuento_actual: number;
  sugerencia_ia: number;
  estado: Status;
  id: string; // Use skuId as id
}

interface CapitalAtrapado {
  categorias: string[];
  atrapado: number[];
  liberado: number[];
  total_invertido: number[];
  porcentaje_recuperado: number[];
  productos: number[];
}

interface VelocidadLiquidacion {
  categorias: string[];
  velocidad_real: number[];
  velocidad_meta: number[];
  gap: number[];
  valor_remanente: number[];
}

// +++ AÑADE ESTA FUNCIÓN HELPER +++
const formatCurrencyAbbreviated = (value: number): string => {
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
  
  // Para valores menores
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
// +++ FIN DE LA FUNCIÓN HELPER +++

const getJustificationTooltip = (item: Product): string => {
  // Desestructuramos los valores que ya tienes en la fila
  const { estado, avance_actual, meta_venta, descuento_actual, sugerencia_ia } = item;

  switch (estado) {
    case 'Alertar':
      return `Justificación de la IA:\n\nEl avance de ventas (${avance_actual}) está muy por debajo de su meta (${meta_venta}). El descuento actual del ${descuento_actual}% es insuficiente.\n\nSe recomienda un ajuste agresivo al ${sugerencia_ia}%.`;
      
    case 'Oportunidad':
      return `Justificación de la IA:\n\nEl avance de ventas (${avance_actual}) es moderado, pero necesita un impulso para alcanzar la meta (${meta_venta}).\n\nSe recomienda un ajuste moderado al ${sugerencia_ia}%.`;

    case 'Mantener':
      return `Justificación de la IA:\n\n¡Buen rendimiento! El avance de ventas (${avance_actual}) está en línea o superando la meta (${meta_venta}).\n\nEl descuento actual del ${descuento_actual}% es óptimo y se recomienda mantenerlo.`;
      
    default:
      return 'Análisis de IA no disponible.';
  }
};

const StatusTag = ({ status }: { status: Status }) => {
  let colorClasses = '';
  switch (status) {
    case 'Alertar': colorClasses = 'bg-orange-100 text-orange-800'; break;
    case 'Mantener': colorClasses = 'bg-blue-100 text-blue-800'; break;
    case 'Oportunidad': colorClasses = 'bg-purple-100 text-purple-800'; break;
    default: colorClasses = 'bg-gray-100 text-gray-800';
  }
  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full cursor-pointer ${colorClasses}`}>{status}</span>
  );
};

// REEMPLAZA TU COMPONENTE 'CapitalAtrapadoChart' CON ESTE:
// REEMPLAZA TU COMPONENTE 'CapitalAtrapadoChart' CON ESTE:
const CapitalAtrapadoChart = ({ 
  title, 
  data
}: { 
  title: string; 
  data: CapitalAtrapado;
}) => {
  const { categorias = [], atrapado = [], liberado = [] } = data || {};

  // --- LÓGICA LOGARÍTMICA ---
  const linearMaxValue = Math.max(...atrapado.map((a, i) => a + liberado[i]), 1);
  const logMaxValue = Math.log10(linearMaxValue + 1);

  const getLogHeightPercentage = (value: number) => {
    if (value <= 0) return 0;
    return (Math.log10(value + 1) / logMaxValue) * 100;
  };
  // --- FIN DE LA LÓGICA ---
  
  return (  
    <div className="w-full lg:w-1/2 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h4 className="font-bold text-[#34495E] mb-4">{title}</h4>
      <div className="h-64 flex items-end space-x-4">
        {categorias.map((cat, i) => {
          const total = atrapado[i] + liberado[i];
          const totalLogHeightPercent = getLogHeightPercentage(total);
          const liberadoPercentOfTotal = (total > 0) ? (liberado[i] / total) * 100 : 0;
          const atrapadoPercentOfTotal = 100 - liberadoPercentOfTotal;
          
          return (
            <div 
              key={i} 
              // --- CAMBIO: Quitamos 'cursor-pointer' y 'onClick' ---
              className="flex-1 flex flex-col-reverse items-center group"
            >
              {/* --- CAMBIO: Quitamos 'group-hover:text-blue-600' --- */}
              <p className="text-xs text-gray-500 font-semibold mt-2 truncate w-full text-center">{cat}</p>
              
              <div className="text-xs font-semibold text-gray-700 mb-1">
                {formatCurrencyAbbreviated(total)}
              </div>
              
              <div className="w-full flex flex-col-reverse" style={{ height: '200px' }}>
                <div 
                  className="w-full flex flex-col-reverse" 
                  style={{ height: `${totalLogHeightPercent}%`, minHeight: '2px' }}
                >
                  <div
                    className="w-full bg-green-500 group-hover:bg-green-600 transition-colors"
                    style={{ height: `${liberadoPercentOfTotal}%` }} 
                    title={`Liberado: S/ ${liberado[i].toLocaleString('es-PE')}`}
                  />
                  <div
                    className="w-full bg-red-500 group-hover:bg-red-600 transition-colors rounded-t-md"
                    style={{ height: `${atrapadoPercentOfTotal}%` }} 
                    title={`Atrapado: S/ ${atrapado[i].toLocaleString('es-PE')}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Leyenda */}
      <div className="flex justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center">
          <span className="w-3 h-3 bg-green-500 mr-1 rounded"></span>
          Liberado
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 bg-red-500 mr-1 rounded"></span>
          Atrapado
        </div>
      </div>
    </div>
  );
};

// REEMPLAZA ESTE COMPONENTE (Líneas 133-188)
// REEMPLAZA ESTE COMPONENTE
const VelocidadChart = ({ 
  title, 
  data
}: { 
  title: string; 
  data: VelocidadLiquidacion;
}) => {
  const { categorias = [], velocidad_real = [], velocidad_meta = [] } = data || {};
  const maxValue = Math.max(...velocidad_real, ...velocidad_meta, 100);

  const getPoints = (values: number[]) => {
    const width = 300;
    const height = 100;
    const step = values.length > 1 ? width / (values.length - 1) : width;
    if (values.length === 1) {
      return `${width / 2},${height - (values[0] / maxValue) * height}`;
    }
    return values.map((p, i) => `${i * step},${height - (p / maxValue) * height}`).join(' ');
  };

  const realPoints = getPoints(velocidad_real);
  const metaPoints = getPoints(velocidad_meta);
  const reversedRealPoints = realPoints.split(' ').reverse().join(' ');
  const gapPolygonPoints = `${metaPoints} ${reversedRealPoints}`;

  return (
    <div className="w-full lg:w-1/2 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h4 className="font-bold text-[#34495E] mb-4">{title}</h4>
      <div className="h-64 relative">
        <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
          <polygon
            fill="rgba(239, 68, 68, 0.15)"
            stroke="none"
            points={gapPolygonPoints}
          />
          <polyline fill="none" stroke="#10b981" strokeWidth="2" points={metaPoints} />
          <polyline fill="none" stroke="#ef4444" strokeWidth="2.5" points={realPoints} />
          
          {velocidad_real.map((p, i) => (
            <circle 
              key={`real-${i}`} 
              cx={(categorias.length > 1 ? (300 / (categorias.length - 1)) * i : 150)} 
              cy={100 - (p / maxValue) * 100} 
              r="4" 
              fill="#ef4444"
            >
              <title>{`Real: ${p}%`}</title>
            </circle>
          ))}
          {velocidad_meta.map((p, i) => (
            <circle 
              key={`meta-${i}`} 
              cx={(categorias.length > 1 ? (300 / (categorias.length - 1)) * i : 150)} 
              cy={100 - (p / maxValue) * 100} 
              r="4" 
              fill="#10b981"
     >
              <title>{`Meta: ${p}%`}</title>
            </circle>
          ))}
        </svg>
        
        {/* Leyenda (sin cambios) */}
        <div className="absolute top-0 right-0 text-xs">
          <div className="flex items-center mb-1">
            <span className="w-3 h-3 bg-red-500 mr-2 rounded-full"></span>Real
       </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 mr-2 rounded-full"></span>Meta
          </div>
        </div>
      </div>
      
      {/* --- CAMBIO: Se quita el 'cursor-pointer' y 'onClick' --- */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        {categorias.map((cat, i) => (
          <span 
            key={i} 
            className="truncate w-1/5 text-center px-1 font-medium"
          >
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
};

export const Monitoreo = ({ openModal }: { openModal: (content: ModalContent) => void }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [showAdjustOnly, setShowAdjustOnly] = useState(false);
  const [showMarginOpportunities, setShowMarginOpportunities] = useState(false);

  // API State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(true); // Start with initial load

  // Chart State
  const [chartData, setChartData] = useState<{
    capital_atrapado: CapitalAtrapado;
    velocidad_liquidacion: VelocidadLiquidacion;
  } | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [chartsError, setChartsError] = useState<string | null>(null);

  // Filter State
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [skuInput, setSkuInput] = useState('');

  const fetchProducts = useCallback(async (params: URLSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/analisis-ventas?${params.toString()}`);
      if (!response.ok) throw new Error('Error al obtener los datos de productos.');
      const data = await response.json();
      if (Array.isArray(data)) {
        setProducts(data.map(p => ({ ...p, id: p.skuId })));
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar al servidor.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'Todas') params.append('categoria', selectedCategory);
    if (selectedBrand !== 'Todas') params.append('marca', selectedBrand);
    if (skuInput.trim()) params.append('sku', skuInput.trim());
    fetchProducts(params);
  };
  
  // Fetch initial data, filters and chart data
  useEffect(() => {
    fetchProducts(new URLSearchParams()); // Initial product load without filters

    const fetchInitialData = async () => {
      // Fetch Filters
      try {
        const catResponse = await fetch(`${API_BASE_URL}/categorias`);
        if (!catResponse.ok) throw new Error('No se pudieron cargar las categorías');
        const catData = await catResponse.json();
        setCategories(Array.isArray(catData) ? catData : []);
      } catch (err) {
        setFilterError('No se pudieron cargar los filtros.');
      } finally {
        setCategoriesLoading(false);
      }
      
      // Fetch Chart Data
      try {
        const chartsResponse = await fetch(`${API_BASE_URL}/dashboard-charts`);
        if (!chartsResponse.ok) throw new Error('No se pudieron cargar los datos de las gráficas.');
        const data = await chartsResponse.json();
        setChartData(data);
      } catch (err: any) {
          setChartsError(err.message || 'Error al conectar con el servidor para las gráficas.');
      } finally {
          setChartsLoading(false);
      }
    };
    fetchInitialData();
  }, [fetchProducts]);

  // Fetch brands when category changes
  useEffect(() => {
    if (selectedCategory === 'Todas') {
      setBrands([]);
      setSelectedBrand('Todas');
      return;
    }
    const fetchBrands = async () => {
      setBrandsLoading(true);
      try {
        const brandResponse = await fetch(`${API_BASE_URL}/marcas?categoria=${encodeURIComponent(selectedCategory)}`);
        if (!brandResponse.ok) throw new Error('No se pudieron cargar las marcas');
        const brandData = await brandResponse.json();
        setBrands(Array.isArray(brandData) ? brandData : []);
      } catch (err) {
        setFilterError('No se pudieron cargar las marcas para la categoría seleccionada.');
        setBrands([]);
      } finally {
        setBrandsLoading(false);
      }
    };
    fetchBrands();
  }, [selectedCategory]);

  
  const displayedData = useMemo(() => {
      let filteredData = products;
      if (showAdjustOnly) {
          filteredData = filteredData.filter(item => item.estado === 'Alertar');
      }
      if (showMarginOpportunities) {
          filteredData = filteredData.filter(item => item.estado === 'Oportunidad');
      }
      return filteredData;
  }, [products, showAdjustOnly, showMarginOpportunities]);

  const getAvanceStyling = (avance: string) => {
    const num = parseInt(avance, 10);
    if (num >= 80) return 'text-green-600 font-bold';
    if (num < 50) return 'text-red-600 font-bold';
    return 'text-gray-700';
  };

  const handleSelect = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isAllSelected = useMemo(() => {
    return displayedData.length > 0 && displayedData.every(p => selected.includes(p.id));
  }, [displayedData, selected]);
  
  const handleSelectAll = () => {
    const displayedIds = displayedData.map(p => p.id);
    if (isAllSelected) {
      setSelected(prev => prev.filter(id => !displayedIds.includes(id)));
    } else {
      setSelected(prev => [...new Set([...prev, ...displayedIds])]);
    }
  };

  const renderTable = () => {
    if (isLoading) return <div className="text-center py-16">Cargando productos...</div>;
    if (error) return <div className="text-center py-16 text-red-600">{error}</div>;
    if (products.length === 0 && hasSearched) return (
        <div className="text-center py-16 text-gray-500">
            <InboxIcon className="w-16 h-16 mx-auto text-gray-300"/>
            <h4 className="mt-4 text-lg font-semibold text-[#34495E]">No se encontraron productos</h4>
            <p className="text-sm">Intente ajustar los filtros de búsqueda.</p>
        </div>
    );

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200">
                <th className="p-4 w-12">
                  <div onClick={handleSelectAll} className="cursor-pointer">
                    <CheckboxIcon checked={isAllSelected} />
                  </div>
                </th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Meta Venta</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Avance Actual</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Sell-Through</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Sugerencia IA (%)</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {displayedData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div onClick={() => handleSelect(item.id)} className="cursor-pointer">
                            <CheckboxIcon checked={selected.includes(item.id)} />
                          </div>
                        </td>
                        <td className="p-4">
                            <p className="font-medium text-gray-800">{item.producto}</p>
                            <p className="text-xs text-gray-500 font-mono">SKU: {item.skuId}</p>
                        </td>
                        <td className="p-4 text-gray-700 text-center">{item.meta_venta}</td>
                        <td className={`p-4 text-center ${getAvanceStyling(item.avance_actual)}`}>{item.avance_actual}</td>
                        <td className="p-4 text-gray-700 text-center">{item.sell_through}</td>
                        <td className="p-4 text-center">
                        {/* Agregamos un <div> contenedor que:
                          1. Tiene el 'title' (este es el tooltip nativo del navegador).
                          2. 'cursor-help' para que el usuario sepa que puede interactuar.
                        */}
                        <div 
                          className="cursor-help" 
                          title={getJustificationTooltip(item)}
                        >
                            <span className="text-gray-500">{item.descuento_actual}%</span>
                            <span className="mx-1 text-gray-400">→</span>
                            
                            {/* Agregamos un subrayado punteado para mayor visibilidad 
                              de que el texto tiene información extra
                            */}
                            <span className={`font-bold border-b border-dotted border-gray-400 ${item.sugerencia_ia > item.descuento_actual ? 'text-blue-600' : item.sugerencia_ia < item.descuento_actual ? 'text-orange-500' : 'text-gray-700'}`}>
                            {item.sugerencia_ia}%
                            </span>
                        </div>
                      </td>
                        <td className="p-4"><StatusTag status={item.estado} /></td>
                    </tr>
                ))}
            </tbody>
            </table>
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-base text-[#7F8C8D]">
        Visualice el rendimiento de sus estrategias con gráficos evolutivos y tablas de métricas. Reciba nuevas sugerencias para ajustar descuentos y maximizar el sell-through.
      </p>
      {/* Charts */}
       <div className="flex flex-col lg:flex-row gap-6">
{chartsLoading ? (
  <>
    <div className="w-full lg:w-1/2 p-6 h-80 border border-gray-200 rounded-lg bg-gray-50 shadow-sm animate-pulse"></div>
    <div className="w-full lg:w-1/2 p-6 h-80 border border-gray-200 rounded-lg bg-gray-50 shadow-sm animate-pulse"></div>
  </>
) : chartsError ? (
  <div className="w-full text-center py-10 text-red-600 bg-red-50 rounded-lg border border-red-200">{chartsError}</div>
) : chartData ? (
<>
    <CapitalAtrapadoChart 
      title="Capital en Liquidación: Atrapado vs. Liberado (Top 5)" 
      data={chartData.capital_atrapado} 
    />
    <VelocidadChart 
      title="Velocidad de Liquidación: Real vs. Meta (Top 5)" 
      data={chartData.velocidad_liquidacion} 
    />
  </>
) : null}
      </div>
      
       {/* Filters */}
       <div className="bg-gray-50 p-6 rounded-lg border border-[#ECF0F1]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select 
                value={selectedCategory}
                onChange={e => { setSelectedCategory(e.target.value); setSelectedBrand('Todas'); }}
                className="w-full border border-[#ECF0F1] rounded-md px-3 py-2 text-[#34495E] focus:outline-none focus:ring-2 focus:ring-[#D9534F]/50"
                disabled={categoriesLoading}
              >
                  <option value="Todas">Todas las categorías</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)} 
                className="w-full border border-[#ECF0F1] rounded-md px-3 py-2 text-[#34495E] focus:outline-none focus:ring-2 focus:ring-[#D9534F]/50"
                disabled={brandsLoading || selectedCategory === 'Todas'}
              >
                  <option value="Todas">Todas las marcas</option>
                  {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
              </select>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por SKU</label>
              <input 
                type="text" 
                placeholder="Ej: 12345" 
                value={skuInput}
                onChange={e => setSkuInput(e.target.value)}
                className="w-full border border-[#ECF0F1] rounded-md px-3 py-2 text-[#34495E] focus:outline-none focus:ring-2 focus:ring-[#D9534F]/50" 
              />
           </div>
           <button onClick={handleSearch} className="w-full flex items-center justify-center bg-[#D9534F] text-white font-semibold px-6 py-2 rounded-md hover:bg-[#C0392B] transition-colors">
              <SearchIcon /> <span className="ml-2">Buscar</span>
           </button>
        </div>
        {filterError && <p className="text-red-500 text-sm mt-2">{filterError}</p>}
      </div>

      {/* Adjustment Table */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 text-[#34495E] text-sm font-medium cursor-pointer">
                    <input type="checkbox" checked={showAdjustOnly} onChange={() => setShowAdjustOnly(s => !s)} className="h-4 w-4 rounded border-gray-300 text-[#D9534F] focus:ring-[#D9534F]" />
                    <span>Mostrar solo SKUs a ajustar</span>
                </label>
                 <label className="flex items-center space-x-2 text-[#34495E] text-sm font-medium cursor-pointer">
                    <input type="checkbox" checked={showMarginOpportunities} onChange={() => setShowMarginOpportunities(s => !s)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <span>Ver oportunidades de margen</span>
                </label>
            </div>
            <div className="flex items-center space-x-4">
                <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-100 transition-colors text-sm">
                    <DownloadIcon /> Descargar
                </button>
                <button
                    disabled={selected.length === 0}
                    className="px-4 py-2 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed bg-[#D9534F] hover:bg-[#C0392B] text-sm">
                    Aplicar y Enviar a Pricing
                </button>
            </div>
        </div>
        {renderTable()}
      </div>
    </div>
  );
};