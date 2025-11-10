
import React, { useState, useEffect, useCallback } from 'react';
import { CheckboxIcon, DownloadIcon, SearchIcon, TinySparkleIcon, ApplyIcon, WarningIcon } from './Icons';
import { ModalContent } from './Modal';

// API Configuration
const API_BASE_URL = 'https://test-smart-clear-395411569598.us-central1.run.app';

// Updated data structure with UI-specific state
interface Product {
  skuId: number;
  Producto: string;
  P_Regular: number;
  Stock: number;
  Dto_Sugerido: number;
  Justificacion: string;
  Dto_Final: number; 
  P_Liquidacion: number;
  // UI state
  forecast: string;
  hasWarning: boolean;
  marginImpact: number;
}

// Data structure for an item in the history table
interface HistoryItem {
  skuId: number;
  Producto: string;
  P_Regular: number;
  Dto_Final: number;
  P_Liquidacion: number;
  Estado: 'Procesado' | 'Pendiente' | 'Rechazado';
}

interface GestionDescuentosProps {
  openModal: (content: ModalContent) => void;
  closeModal: () => void;
}

const StatusTag = ({ status }: { status: HistoryItem['Estado'] }) => {
  let colorClasses = '';
  switch (status) {
    case 'Procesado': colorClasses = 'bg-green-100 text-green-800'; break;
    case 'Pendiente': colorClasses = 'bg-yellow-100 text-yellow-800'; break;
    case 'Rechazado': colorClasses = 'bg-red-100 text-red-800'; break;
  }
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses}`}>{status}</span>;
};


export const GestionDescuentos: React.FC<GestionDescuentosProps> = ({ openModal, closeModal }) => {
  // Main data state
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  
  // UI/API interaction state
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for dynamic filter options
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(true);

  // State for filter inputs
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [skuInput, setSkuInput] = useState('');

  // FIX: Define fetchFilters to be callable for retrying on error.
  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setFilterError(null);
    try {
      const catResponse = await fetch(`${API_BASE_URL}/categorias`);
      if (!catResponse.ok) throw new Error('No se pudieron cargar las categorías');
      const catData = await catResponse.json();
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error("Error cargando las categorías:", err);
      setFilterError('No se pudieron cargar los filtros de categoría.');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);
  
  const fetchFilters = fetchCategories;

  // Fetch categories ONCE on component mount
  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);
  
  // Fetch all history ONCE on component mount
  useEffect(() => {
    const fetchInitialHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const historyResponse = await fetch(`${API_BASE_URL}/ver-descuentos`);
        if (!historyResponse.ok) throw new Error('Error al cargar historial');
        const historyData = await historyResponse.json();
        if (Array.isArray(historyData)) {
          const formattedHistory: HistoryItem[] = historyData.map((item: any) => ({
            skuId: item.skuId,
            Producto: item.ProductName,
            P_Regular: item.RegularPrice,
            Dto_Final: item.dto_final,
            P_Liquidacion: item.p_liquidacion,
            Estado: 'Procesado',
          }));
          setHistory(formattedHistory);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error("Error al cargar historial inicial:", err);
        setHistory([]);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchInitialHistory();
  }, []);

  // Fetch brands WHENEVER selectedCategory changes
  useEffect(() => {
    const fetchBrands = async () => {
      setBrandsLoading(true);
      let url = `${API_BASE_URL}/marcas`;
      if (selectedCategory !== 'Todas') {
        url += `?categoria=${encodeURIComponent(selectedCategory)}`;
      }
      try {
        const brandResponse = await fetch(url);
        if (!brandResponse.ok) throw new Error('No se pudieron cargar las marcas');
        const brandData = await brandResponse.json();
        setBrands(Array.isArray(brandData) ? brandData : []);
      } catch (err) {
        console.error(`Error cargando marcas para la categoría ${selectedCategory}:`, err);
        setFilterError('No se pudieron cargar las marcas para la categoría seleccionada.');
        setBrands([]); // Clear brands on error
      } finally {
        setBrandsLoading(false);
      }
    };
    fetchBrands();
  }, [selectedCategory]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedBrand('Todas'); // Reset brand selection
  };


  // Calculates liquidation price based on regular price and final discount
  const calculateLiquidationPrice = (regularPrice: number, finalDiscount: number): number => {
    const price = regularPrice * (1 - (finalDiscount / 100));
    return parseFloat(price.toFixed(2));
  };

  const generateForecast = (dto: number, dtoSugerido: number): string => {
    if (dto > dtoSugerido) {
        return `Aumenta la velocidad de liquidación.`;
    }
    if (dto < dtoSugerido) {
        return `Reduce la velocidad de liquidación.`;
    }
    return 'Estimación de liquidación óptima.';
  }

  // Handler for changing the final discount input
  const handleDiscountChange = (skuId: number, newDiscountStr: string) => {
    setProducts(prev => prev.map(p => {
      if (p.skuId === skuId) {
        const newDiscount = newDiscountStr === '' ? 0 : parseFloat(newDiscountStr);
        const Dto_Final = isNaN(newDiscount) || newDiscount < 0 ? 0 : Math.min(newDiscount, 100);
        const P_Liquidacion = calculateLiquidationPrice(p.P_Regular, Dto_Final);
        const forecast = generateForecast(Dto_Final, p.Dto_Sugerido);
        const hasWarning = Dto_Final > 70; // Guardrail
        const marginImpact = P_Liquidacion - (p.P_Regular * 0.6); // Mocked cost at 60% of regular price

        return { ...p, Dto_Final, P_Liquidacion, forecast, hasWarning, marginImpact };
      }
      return p;
    }));
  };

  const handleApplySuggestion = (skuId: number) => {
    const product = products.find(p => p.skuId === skuId);
    if (product) {
      handleDiscountChange(skuId, product.Dto_Sugerido.toString());
    }
  }

  // Selection logic
  const handleSelect = (skuId: number) => {
    setSelected(prev =>
      prev.includes(skuId) ? prev.filter(i => i !== skuId) : [...prev, skuId]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(products.map(p => p.skuId));
    } else {
      setSelected([]);
    }
  };
  
  const isAllSelected = products.length > 0 && selected.length === products.length;

  const handleSearch = useCallback(async () => {
    setHasSearched(true);
    setIsLoading(true);
    setError(null);
    setProducts([]);
    setHistory([]);

    const mermaParams = new URLSearchParams();
    if (selectedCategory !== 'Todas') mermaParams.append('categoria', selectedCategory);
    if (selectedBrand !== 'Todas') mermaParams.append('marca', selectedBrand);
    if (skuInput.trim() !== '') mermaParams.append('sku', skuInput.trim());

    const historyParams = new URLSearchParams();
    if (selectedCategory !== 'Todas') historyParams.append('categoria', selectedCategory);
    if (selectedBrand !== 'Todas') historyParams.append('marca', selectedBrand);

    try {
        const [mermaResponse, historyResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/mostrar-merma?${mermaParams.toString()}`),
            fetch(`${API_BASE_URL}/ver-descuentos?${historyParams.toString()}`)
        ]);

        if (!mermaResponse.ok) throw new Error(`Error al buscar sugerencias: ${mermaResponse.status}`);
        if (!historyResponse.ok) throw new Error(`Error al buscar historial: ${historyResponse.status}`);

        const mermaData = await mermaResponse.json();
        const historyData = await historyResponse.json();

        // Process merma data
        if (Array.isArray(mermaData)) {
            const enhancedData = mermaData.map(item => {
                const dtoFinal = item.Dto_Sugerido;
                const pLiquidacion = calculateLiquidationPrice(item.P_Regular, dtoFinal);
                return {
                    ...item,
                    Dto_Final: dtoFinal,
                    P_Liquidacion: pLiquidacion,
                    forecast: generateForecast(dtoFinal, item.Dto_Sugerido),
                    hasWarning: dtoFinal > 70,
                    marginImpact: pLiquidacion - (item.P_Regular * 0.6)
                };
            });
            setProducts(enhancedData);
        } else {
            setProducts([]);
        }

        // Process history data
        if (Array.isArray(historyData)) {
            const formattedHistory: HistoryItem[] = historyData.map((item: any) => ({
                skuId: item.skuId,
                Producto: item.ProductName,
                P_Regular: item.RegularPrice,
                Dto_Final: item.dto_final,
                P_Liquidacion: item.p_liquidacion,
                Estado: 'Procesado',
            }));
            setHistory(formattedHistory);
        } else {
            setHistory([]);
        }
    } catch (err: any) {
        setError('No se pudo conectar con el servidor. Por favor, intente más tarde.');
        console.error(err);
        setProducts([]);
        setHistory([]);
    } finally {
        setIsLoading(false);
    }
}, [selectedCategory, selectedBrand, skuInput]);


  const handleSendToPricing = () => {
    openModal({
      type: 'confirm',
      title: 'Confirmar Envío a Pricing',
      body: `Estás a punto de enviar ${selected.length} producto(s) con los descuentos finales configurados. ¿Deseas continuar?`,
      primaryActionText: 'Confirmar y Enviar',
      onPrimaryAction: async () => {
        const itemsToSend = products.filter(p => selected.includes(p.skuId));
        
        const payload = {
          productos: itemsToSend.map(p => ({
              skuId: Number(p.skuId),
              dto_final: Number(p.Dto_Final),
              p_liquidacion: Number(p.P_Liquidacion)
          }))
        };

        try {
          const response = await fetch(`${API_BASE_URL}/enviar-a-pricing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error en el servidor' }));
            throw new Error(`Error ${response.status}: ${errorData.message || 'No se pudo completar la solicitud'}`);
          }
          
          const responseData = await response.json();

          const newHistoryItems: HistoryItem[] = itemsToSend.map(p => ({
              skuId: p.skuId,
              Producto: p.Producto,
              P_Regular: p.P_Regular,
              Dto_Final: p.Dto_Final,
              P_Liquidacion: p.P_Liquidacion,
              Estado: 'Procesado',
          }));

          setHistory(prev => [...newHistoryItems, ...prev]);
          setProducts(prev => prev.filter(p => !selected.includes(p.skuId)));
          setSelected([]);
          
          openModal({
            type: 'success',
            title: 'Envío Exitoso',
            body: `Se enviaron ${responseData.productos_actualizados || itemsToSend.length} producto(s) a pricing. Omitidos: ${responseData.productos_omitidos || 0}.`,
            primaryActionText: 'OK',
            onPrimaryAction: closeModal,
          });

        } catch (err: any) {
           console.error("Error al enviar a pricing:", err);
           openModal({
            type: 'confirm',
            title: 'Error de Envío',
            body: `No se pudieron enviar los productos. ${err.message}`,
            primaryActionText: 'Entendido',
            onPrimaryAction: closeModal,
          });
        }
      },
    });
  };

  const renderMainContent = () => {
    if (!hasSearched) {
      return <p className="text-center text-[#95A5A6] py-20">Utilice los filtros y haga clic en Buscar para ver las sugerencias de descuento.</p>;
    }

    if (isLoading) {
      return <p className="text-center text-[#34495E] font-semibold py-20">Buscando sugerencias...</p>;
    }

    if (error) {
       return (
        <div className="text-center py-20">
          <p className="text-[#E74C3C] font-semibold">{error}</p>
          <button
            onClick={handleSearch}
            className="mt-4 px-6 py-2 bg-[#D9534F] text-white font-semibold rounded-md hover:bg-[#C0392B] transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }
    
    if (products.length === 0) {
        return <div className="text-center py-20 text-[#95A5A6]">No se encontraron productos para liquidación con los filtros seleccionados.</div>
    }

    return (
      <>
      {/* Suggestions Table */}
              <div className="bg-white p-6 rounded-lg border border-[#ECF0F1] space-y-4">

                {/* --- AÑADE ESTA LÍNEA --- */}
                <h3 className="text-xl font-bold text-[#34495E]">SKUs Pendientes de Aprobación</h3>

                <div className="flex justify-between items-center">
            <p className="text-[#34495E] font-semibold">{selected.length} de {products.length} seleccionados</p>
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-4 py-2 bg-white border border-[#bdc3c7] text-[#34495E] font-semibold rounded-md hover:bg-gray-100 transition-colors">
                <DownloadIcon /> Descargar SKUs
              </button>
              <button
                onClick={handleSendToPricing}
                disabled={selected.length === 0}
                className="px-4 py-2 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed bg-[#3498DB] hover:bg-[#2980B9]">
                Enviar a Pricing
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="border-b-2 border-[#ECF0F1]">
                <tr>
                  <th className="p-4 w-12">
                     <div className="cursor-pointer" onClick={() => handleSelectAll({ target: { checked: !isAllSelected } } as any)}>
                        <CheckboxIcon checked={isAllSelected} />
                     </div>
                  </th>
                  <th className="p-4 text-[#34495E] font-bold">Producto</th>
                  <th className="p-4 text-[#34495E] font-bold">P. Regular</th>
                  <th className="p-4 text-[#34495E] font-bold">Stock</th>
                  <th className="p-4 text-[#34495E] font-bold">Dto. Sugerido</th>
                  <th className="p-4 text-[#34495E] font-bold">Dto. Final (%)</th>
                  <th className="p-4 text-[#34495E] font-bold">P. Liquidación</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.skuId} className="border-b border-[#ECF0F1] hover:bg-gray-50">
                    <td className="p-4">
                      <div onClick={() => handleSelect(p.skuId)} className="cursor-pointer">
                        <CheckboxIcon checked={selected.includes(p.skuId)} />
                      </div>
                    </td>
                    <td className="p-4">
                        <p className="font-medium text-[#34495E]">{p.Producto}</p>
                        <p className="text-sm text-[#7F8C8D]">{p.skuId}</p>
                    </td>
                    <td className="p-4 text-[#34495E]">S/ {p.P_Regular.toFixed(2)}</td>
                    <td className="p-4 text-center text-[#34495E]">{p.Stock}</td>
                    <td className="p-4 text-blue-600 font-semibold text-center">
                        <div className="relative group flex items-center justify-center gap-1">
                            {p.Dto_Sugerido}%
                            <TinySparkleIcon />
                          <div className="absolute bottom-full mb-2 w-72 whitespace-normal bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                              <p className="font-bold mb-1">Justificación IA:</p>
                              {p.Justificacion}. Con este dcto. se estima liquidar el stock en 35 días.
                          </div>
                        </div>
                    </td>
                    <td className="p-4 w-64">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={p.Dto_Final}
                          onChange={(e) => handleDiscountChange(p.skuId, e.target.value)}
                          className={`w-24 border rounded-md px-2 py-1 text-center font-semibold text-[#34495E] focus:outline-none focus:ring-2 focus:ring-[#D9534F]/50 ${p.hasWarning ? 'border-red-500 ring-red-500/50' : 'border-[#ECF0F1]'}`}
                        />
                        <button onClick={() => handleApplySuggestion(p.skuId)} title="Aplicar sugerencia" className="p-1 text-gray-400 hover:text-blue-600">
                          <ApplyIcon />
                        </button>
                      </div>
                      {p.hasWarning ? (
                         <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><WarningIcon /> Descuento genera margen negativo.</p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">{p.forecast}</p>
                      )}
                    </td>
                    <td className="p-4 font-bold text-orange-500">
                      S/ {p.P_Liquidacion.toFixed(2)}
                      <p className={`text-xs font-normal ${p.marginImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        (Margen: {p.marginImpact >= 0 ? '+' : ''}S/ {p.marginImpact.toFixed(2)})
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };
  
  if (categoriesLoading) {
    return <div className="text-center py-20 text-[#34495E] font-semibold">Cargando filtros...</div>;
  }

  if (filterError) {
    return (
      <div className="text-center py-20">
        <p className="text-[#E74C3C] font-semibold">{filterError}</p>
        <button
          onClick={fetchFilters}
          className="mt-4 px-6 py-2 bg-[#D9534F] text-white font-semibold rounded-md hover:bg-[#C0392B] transition-colors"
        >
          Reintentar Carga
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-base text-[#7F8C8D]">
        Reciba sugerencias de descuento generadas por IA para cada producto obsoleto. Ajuste los precios, confirme las acciones y envíe la información directamente al equipo de pricing.
      </p>
      {/* Filters */}
      <div className="bg-gray-50 p-6 rounded-lg border border-[#ECF0F1]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select 
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full border border-[#ECF0F1] rounded-md px-3 py-2 text-[#34495E] focus:outline-none focus:ring-2 focus:ring-[#D9534F]/50"
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
                disabled={brandsLoading}
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
      </div>

      {renderMainContent()}

            {/* --- AÑADE ESTA LÍNEA SEPARADORA --- */}
            <hr className="my-6 border-gray-200" />

            {/* History Table */}
            <div className="bg-white p-6 rounded-lg border border-[#ECF0F1] space-y-4">
        <h3 className="text-xl font-bold text-[#34495E]">Historial de Envíos a Pricing</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b-2 border-[#ECF0F1]">
              <tr>
                <th className="p-4 text-[#34495E] font-bold">SKU</th>
                <th className="p-4 text-[#34495E] font-bold">PRODUCTO</th>
                <th className="p-4 text-[#34495E] font-bold">P. REGULAR</th>
                <th className="p-4 text-[#34495E] font-bold">DTO. FINAL (%)</th>
                <th className="p-4 text-[#34495E] font-bold">P. LIQUIDACIÓN</th>
                <th className="p-4 text-[#34495E] font-bold">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {isHistoryLoading ? (
                 <tr>
                    <td colSpan={6} className="text-center p-8 text-[#95A5A6]">Cargando historial...</td>
                 </tr>
              ) : history.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="text-center p-8 text-[#95A5A6]">
                        {hasSearched ? 'Aún no se han enviado productos a Pricing con estos filtros.' : 'Aún no se han enviado productos a Pricing.'}
                      </td>
                  </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.skuId} className="border-b border-[#ECF0F1] bg-gray-50">
                    <td className="p-4 text-[#7F8C8D]">{h.skuId}</td>
                    <td className="p-4 text-[#34495E]">{h.Producto}</td>
                    <td className="p-4 text-[#34495E]">S/ {h.P_Regular.toFixed(2)}</td>
                    <td className="p-4 text-[#34495E] font-semibold text-center">{h.Dto_Final}%</td>
                    <td className="p-4 text-[#34495E] font-bold">S/ {h.P_Liquidacion.toFixed(2)}</td>
                    <td className="p-4"><StatusTag status={h.Estado} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
