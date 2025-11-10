
import React, { useState } from 'react';
import { WarningIcon as WarningIconSvg, CheckCircleIcon } from './Icons';

export interface ModalContent {
  type: 'confirm' | 'success';
  title: string;
  body: React.ReactNode;
  primaryActionText: string;
  onPrimaryAction: () => Promise<void> | void;
  secondaryActionText?: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ModalContent;
}

const WarningIcon: React.FC = () => (
    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
        <WarningIconSvg />
    </div>
);


export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, content }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handlePrimaryAction = async () => {
    setIsLoading(true);
    try {
      await content.onPrimaryAction();
    } catch (error) {
      console.error("Error executing modal primary action:", error);
      // The parent component is responsible for handling the error state and showing a new modal if needed.
    } finally {
      // Don't auto-close, but reset loading state if the modal isn't closed by the parent action
      // This is important if the action fails and the user can retry.
      setIsLoading(false);
    }
  };

  const icon = content.type === 'confirm' ? <WarningIcon /> : <CheckCircleIcon />;
  const primaryButtonColor = content.type === 'confirm' ? 'bg-[#D9534F] hover:bg-[#C0392B]' : 'bg-[#D9534F] hover:bg-[#C0392B]';

  return (
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                {icon}
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-[#34495E]" id="modal-title">{content.title}</h3>
                  <div className="mt-2">
                    <div className="text-sm text-[#7F8C8D]">{content.body}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button 
                type="button" 
                className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${primaryButtonColor} disabled:bg-gray-400`}
                onClick={handlePrimaryAction}
                disabled={isLoading}>
                {isLoading ? 'Enviando...' : content.primaryActionText}
              </button>
              {content.secondaryActionText && (
                 <button 
                    type="button" 
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                    disabled={isLoading}>
                    {content.secondaryActionText || 'Cancelar'}
                 </button>
              )}
               {!content.secondaryActionText && content.type === 'confirm' && (
                 <button 
                    type="button" 
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                    disabled={isLoading}>
                    Cancelar
                 </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};