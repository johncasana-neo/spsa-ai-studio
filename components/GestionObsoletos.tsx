
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchIcon, InfoIcon, SortIcon, CheckboxIcon, InboxIcon } from './Icons';
import { ModalContent } from './Modal';

// Updated product structure to match the API response and schema
interface Product {
  skuId: number;
  ProductName: string;
  Brand: string;
  categoria: string;
  dias_inventario: number;
  ratio_stock_venta: number;
  semaforo: 'rojo' | 'verde';
}

const API_BASE_URL = 'https://test-smart-clear-395411569598.us-central1.run.app';

const StatusPill = ({ text, color }: { text: string; color: 'green' | 'red' }) => {
  const colorClasses = color === 'green'
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';
  const dotClasses = color === 'green' ? 'bg-green-500' : 'bg-red-500';
  return (
    <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${colorClasses}`}>
      <span className={`w-2 h-2 mr-2 rounded-full ${dotClasses}`}></span>
      {text}
    </span>
  );
};

interface GestionObsoletosProps {
    openModal: (content: ModalContent) => void;
    closeModal: () => void;
    initialFilter: string | null;
    clearInitialFilter: () => void;
}

export const GestionObsoletos: React.FC<GestionObsoletosProps> = ({ openModal, closeModal, initialFilter, clearInitialFilter }) => {
  const [selected, setSelected] = useState<number[]>([]);
  
  // State for API data
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
  const [hasSearched, setHasSearched] = useState(false);
  const [quickFilter, setQuickFilter] = useState<'todos' | 'riesgo' | 'saludable'>('todos');
  
  const getSemaforoInfo = (product: Product): { text: string; color: 'green' | 'red' } => {
    if (product.semaforo === 'rojo') {
      return { text: 'Riesgo Alto', color: 'red' };
    }
    return { text: 'Normal', color: 'green' };
  };

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

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    const fetchBrands = async () => {
      setBrandsLoading(true);
      let url = `${API_BASE_URL}/marcas`;
      if (selectedCategory !== 'Todas' && selectedCategory !== '') {
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
        setBrands([]);
      } finally {
        setBrandsLoading(false);
      }
    };

    if (!categoriesLoading) {
       fetchBrands();
    }
  }, [selectedCategory, categoriesLoading]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedBrand('Todas');
  };

  const handleSearch = useCallback(async () => {
    if (!hasSearched) setHasSearched(true);
    setIsLoading(true);
    setError(null);
    setQuickFilter('todos');
    
    const params = new URLSearchParams();
    if (selectedCategory !== 'Todas' && selectedCategory !== '') params.append('categoria', selectedCategory);
    if (selectedBrand !== 'Todas' && selectedBrand !== '') params.append('marca', selectedBrand);
    if (skuInput.trim() !== '') params.append('sku', skuInput.trim());

    try {
      const response = await fetch(`${API_BASE_URL}/gestion-obsoletos?${params.toString()}`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      const formattedData = data.map((item: any) => ({...item, skuId: item.skud}));
      setProducts(Array.isArray(formattedData) ? formattedData : []);
    } catch (err: any) {
      setError('No se pudo conectar con el servidor. Por favor, intente más tarde.');
      console.error(err);
      setProducts([]); 
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedBrand, skuInput, hasSearched]);

  // Effect to handle initial filter from dashboard
  useEffect(() => {
    if (initialFilter && !categoriesLoading) {
      setSelectedCategory(initialFilter);
      handleSearch();
      clearInitialFilter(); // Consume the filter so it doesn't run again
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilter, categoriesLoading, clearInitialFilter]);


  const handleSelect = (skuId: number) => {
    setSelected(prev =>
      prev.includes(skuId) ? prev.filter(i => i !== skuId) : [...prev, skuId]
    );
  };
  
  const productsEnRiesgo = useMemo(() => products.filter(p => p.semaforo === 'rojo'), [products]);
  const productsSaludables = useMemo(() => products.filter(p => p.semaforo === 'verde'), [products]);
  
  const displayedProducts = useMemo(() => {
    switch(quickFilter) {
        case 'riesgo': return productsEnRiesgo;
        case 'saludable': return productsSaludables;
        case 'todos':
        default: return products;
    }
  }, [quickFilter, products, productsEnRiesgo, productsSaludables]);

  const isAllDisplayedSelected = useMemo(() => {
    return displayedProducts.length > 0 && displayedProducts.every(p => selected.includes(p.skuId))
  }, [displayedProducts, selected]);
  
  const handleSelectAll = () => {
      const displayedIds = displayedProducts.map(p => p.skuId);
      if (isAllDisplayedSelected) {
          setSelected(prev => prev.filter(id => !displayedIds.includes(id)));
      } else {
          setSelected(prev => [...new Set([...prev, ...displayedIds])]);
      }
  };


  const handleMarkAsObsolete = () => {
    openModal({
      type: 'confirm',
      title: 'Confirmar Acción',
      body: `¿Estás seguro que deseas marcar ${selected.length} producto(s) como obsoleto? Esta acción los moverá al módulo de gestión de descuentos.`,
      primaryActionText: 'Confirmar',
      onPrimaryAction: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/marcar-obsoleto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sku_ids: selected }),
          });

          if (!response.ok) throw new Error('Falló al marcar los productos como obsoletos');
          
          const responseData = await response.json();

          openModal({
            type: 'success',
            title: 'Acción Exitosa',
            body: `Se marcaron ${responseData.skus_actualizados || 0} producto(s) como obsoletos.`,
            primaryActionText: 'OK',
            onPrimaryAction: closeModal,
          });

          setSelected([]);
          await handleSearch();

        } catch (err) {
          console.error("Error al marcar como obsoleto:", err);
           openModal({
            type: 'confirm',
            title: 'Error',
            body: 'No se pudieron marcar los productos como obsoletos. Por favor, intente de nuevo.',
            primaryActionText: 'OK',
            onPrimaryAction: closeModal,
           });
        }
      },
    });
  };

const QuickFilterButton: React.FC<{
    label: string;
    count: number;
    filter: 'todos' | 'riesgo' | 'saludable';
    tooltipText?: string; // <-- 1. Prop opcional añadida
  }> = ({ label, count, filter, tooltipText }) => {
    const isActive = quickFilter === filter;
    const activeClasses = 'bg-red-50 text-[#D9534F] font-semibold';
    const inactiveClasses = 'text-gray-500 hover:bg-gray-100 hover:text-gray-700';

    // 2. Creamos el contenido del botón
    const content = (
      <>
        {label}
        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-[#D9534F] text-white' : 'bg-gray-200 text-gray-600'}`}>
          {count}
        </span>
        {/* 3. Añadimos el ícono si el tooltip existe */}
        {tooltipText && (
          <div className="cursor-help">
            <InfoIcon />
          </div>
        )}
      </>
    );

    return (
      <button
        onClick={() => setQuickFilter(filter)}
        // 4. Añadimos 'group relative' y 'gap-1' para alinear el ícono
        className={`group relative flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors ${isActive ? activeClasses : inactiveClasses}`}
      >
        {content}
        {/* 5. Añadimos el div del tooltip (CSS-only) */}
        {tooltipText && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 whitespace-normal">
            {tooltipText}
          </div>
        )}
      </button>
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
        Identifique productos con riesgo de volverse obsoletos. Utilice los filtros para analizar el inventario y marque los productos que requieran acción para enviarlos a la gestión de descuentos.
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
      
      {hasSearched ? (
        isLoading ? (
          <div className="text-center py-20 text-[#34495E] font-semibold">Buscando productos...</div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-[#E74C3C] font-semibold">{error}</p>
            <button
              onClick={handleSearch}
              className="mt-4 px-6 py-2 bg-[#D9534F] text-white font-semibold rounded-md hover:bg-[#C0392B] transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <QuickFilterButton label="Todos" count={products.length} filter="todos" />
                <QuickFilterButton 
                  label="En Riesgo" 
                  count={productsEnRiesgo.length} 
                  filter="riesgo" 
                  tooltipText="Muestra productos con más de 120 días de inventario O un ratio stock/venta mayor a 4.0."
                />
                <QuickFilterButton 
                  label="Saludables" 
                  count={productsSaludables.length} 
                  filter="saludable" 
                  tooltipText="Muestra productos por debajo de los umbrales de riesgo."
                />
              </div>
              <button
                onClick={handleMarkAsObsolete}
                disabled={selected.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed bg-[#D9534F] hover:bg-[#C0392B]"
              >
                Marcar ({selected.length}) como Obsoletos
              </button>
            </div>
            {displayedProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b-2 border-gray-200 bg-gray-50">
                    <tr>
                      <th className="p-4 w-12">
                        <div onClick={handleSelectAll} className="cursor-pointer">
                          <CheckboxIcon checked={isAllDisplayedSelected} />
                        </div>
                      </th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Días Inventario</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ratio Stock/Venta</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1 group relative">
                          <span>Estado</span>
                          <div className="cursor-help">
                            <InfoIcon />
                          </div>
                          {/* --- MODIFICACIÓN AQUÍ --- */}
                          <div className="absolute top-full left-0 mt-2 w-72 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 whitespace-normal">
                            Indica la salud del inventario:
                            <br/>- <strong>Riesgo Alto:</strong> Más de 120 días de inventario O un ratio stock/venta mayor a 4.0.
                            <br/>- <strong>Saludable:</strong> Por debajo de ambos umbrales.
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                                      {displayedProducts.map(p => {
                                        const semaforo = getSemaforoInfo(p);
                                          
                                          {/* --- INICIO DE LA MODIFICACIÓN --- */}
                                        const isHighInventory = p.dias_inventario > 120;
                                        const isHighRatio = p.ratio_stock_venta > 4.0;
                                        // Estilo base para las celdas
                                        const cellStyle = "p-4 text-center text-[#34495E] font-medium";
                                        // Estilo condicional si está en riesgo
                                        const riskStyle = "text-red-600 font-bold";
                                          {/* --- FIN DE LA MODIFICACIÓN --- */}

                                        return (
                                          <tr key={p.skuId} className="hover:bg-gray-50">
                                            <td className="p-4">
                                              <div onClick={() => handleSelect(p.skuId)} className="cursor-pointer">
                                                <CheckboxIcon checked={selected.includes(p.skuId)} />
                                              </div>
                                            </td>
                                            <td className="p-4">
                                              <p className="font-medium text-[#34495E]">{p.ProductName}</p>
                                              <p className="text-sm text-gray-500">SKU: {p.skuId} | Marca: {p.Brand}</p>
                                            </td>

                                          {/* --- CELDAS MODIFICADAS --- */}
                                            <td className={`${cellStyle} ${semaforo.color === 'red' && isHighInventory ? riskStyle : ''}`}>
                                              {p.dias_inventario}
                                           </td>
                                            <td className={`${cellStyle} ${semaforo.color === 'red' && isHighRatio ? riskStyle : ''}`}>
                                           {p.ratio_stock_venta.toFixed(2)}
                                            </td>
                                          {/* --- FIN DE CELDAS MODIFICADAS --- */}

                                         <td className="p-4"><StatusPill text={semaforo.text} color={semaforo.color} /></td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <InboxIcon className="w-16 h-16 mx-auto text-gray-300"/>
                <h4 className="mt-4 text-lg font-semibold text-[#34495E]">No hay productos que coincidan</h4>
                <p className="text-sm">Intente ajustar los filtros de búsqueda o el filtro rápido.</p>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="text-center bg-white p-20 rounded-lg border border-gray-200 shadow-sm">
          <InboxIcon />
          <h3 className="mt-4 text-lg font-semibold text-[#34495E]">Realice una búsqueda para empezar</h3>
          <p className="mt-2 text-sm text-[#95A5A6]">Utilice los filtros para encontrar productos y evaluar su estado de inventario.</p>
        </div>
      )}
    </div>
  );
};
