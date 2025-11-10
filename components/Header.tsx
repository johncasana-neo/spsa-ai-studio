
import React from 'react';
import { DeviceIcon, RefreshIcon, AvatarIcon } from './Icons';

interface HeaderProps {
    activeView: string;
}

export const Header: React.FC<HeaderProps> = ({ activeView }) => {
  return (
    <header className="flex h-20 items-center justify-between border-b border-[#ECF0F1] bg-white px-8 flex-shrink-0">
      <div>
        <h2 className="text-xl font-semibold text-[#34495E]">{activeView === 'Inicio' ? 'Dashboard de Mando' : activeView}</h2>
      </div>
      <div className="flex items-center space-x-6">
        <button className="text-gray-500 hover:text-[#34495E]">
          <DeviceIcon />
        </button>
        <button className="text-gray-500 hover:text-[#34495E]">
          <RefreshIcon />
        </button>
        <div className="flex items-center space-x-3">
          <span className="text-md font-medium text-[#34495E]">Admin User</span>
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <AvatarIcon />
          </div>
        </div>
      </div>
    </header>
  );
};