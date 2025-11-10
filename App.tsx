import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { GestionObsoletos } from './components/GestionObsoletos';
import { GestionDescuentos } from './components/GestionDescuentos';
import { Monitoreo } from './components/Monitoreo';
import { Alertas } from './components/Alertas';
import { Modal, ModalContent } from './components/Modal';

export default function App() {
  const [activeView, setActiveView] = useState<string>('Inicio');
  const [initialObsoletosFilter, setInitialObsoletosFilter] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    content: ModalContent | null;
  }>({ isOpen: false, content: null });

  const handleOpenModal = (content: ModalContent) => {
    setModalState({ isOpen: true, content });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, content: null });
  };

  const renderContent = () => {
    switch (activeView) {
      case 'Inicio':
        return (
          <Dashboard 
            setActiveView={setActiveView} 
            setInitialObsoletosFilter={setInitialObsoletosFilter} 
          />
        );
      case 'Gestión de Obsoletos':
        return (
          <GestionObsoletos 
            openModal={handleOpenModal} 
            closeModal={handleCloseModal}
            initialFilter={initialObsoletosFilter}
            clearInitialFilter={() => setInitialObsoletosFilter(null)} 
          />
        );
      case 'Gestión de Descuentos':
        return <GestionDescuentos openModal={handleOpenModal} closeModal={handleCloseModal} />;
      case 'Monitoreo y Optimización':
        return <Monitoreo openModal={handleOpenModal} />;
      case 'Alertas':
        return <Alertas openModal={handleOpenModal} closeModal={handleCloseModal} />;
      default:
        return (
          <Dashboard 
            setActiveView={setActiveView} 
            setInitialObsoletosFilter={setInitialObsoletosFilter} 
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-white font-sans">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header activeView={activeView} />
        <main className="flex-1 overflow-y-auto bg-white p-8">
          {renderContent()}
        </main>
      </div>
      {modalState.content && (
        <Modal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          content={modalState.content}
        />
      )}
    </div>
  );
}