import React from 'react';
import { HouseIcon, ListIcon, StarIcon, LineChartIcon, BellIcon } from './Icons';

const menuItems = [
  { name: 'Inicio', icon: <HouseIcon /> },
  { name: 'Gestión de Obsoletos', icon: <ListIcon /> },
  { name: 'Gestión de Descuentos', icon: <StarIcon /> },
  { name: 'Monitoreo y Optimización', icon: <LineChartIcon /> },
  { name: 'Alertas', icon: <BellIcon /> },
];

interface MenuItemProps {
  icon: React.ReactNode;
  name: string;
  active: boolean;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, name, active, onClick }) => {
  const baseClasses = 'flex items-center w-full p-3 my-1 rounded-lg transition-colors duration-200 cursor-pointer';
  const activeClasses = 'bg-[#D9534F] text-white';
  const inactiveClasses = 'text-[#34495E] hover:bg-[#FADBD8]';

  return (
    <li onClick={onClick}>
      <div className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
        <span className="mr-4">{icon}</span>
        <span className="font-medium">{name}</span>
      </div>
    </li>
  );
};

interface SidebarProps {
    activeView: string;
    setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <aside className="w-[20%] max-w-xs flex-shrink-0 bg-[#FEF5F5] p-6 flex flex-col">
      <div className="mb-12 flex items-center h-10">
        <span className="text-4xl font-extrabold text-[#E74C3C] tracking-tight">plaza</span>
        <svg className="h-11 w-8 -ml-1 -mr-2" viewBox="0 0 30 40">
            <path d="M5 15 C 10 30, 15 38, 25 40" stroke="#F1C40F" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
        <span className="text-4xl font-extrabold text-[#E74C3C] tracking-tight">ea</span>
      </div>
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <MenuItem 
                key={item.name} 
                icon={item.icon} 
                name={item.name} 
                active={item.name === activeView}
                onClick={() => setActiveView(item.name)}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
};