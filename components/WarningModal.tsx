import type React from 'react';
import { WarningIcon } from './Icons';
import { useTranslation } from '../contexts/LanguageContext';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const WarningModal: React.FC<WarningModalProps> = ({ isOpen, onClose, message }) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="alertdialog" aria-modal="true">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center animate-slide-up border-4 border-yellow-300">
        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
          <WarningIcon className="h-10 w-10 text-yellow-500" />
        </div>
        <h3 className="mt-5 text-xl font-bold text-gray-900">{t('warningTitle')}</h3>
        <p className="mt-2 text-base text-gray-600">
          {message}
        </p>
        <div className="mt-6">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-3 bg-yellow-500 text-base font-medium text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:text-sm"
            onClick={onClose}
          >
            {t('warningAcknowledge')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarningModal;
