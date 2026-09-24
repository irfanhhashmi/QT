import React from 'react';
import DiagnosticsView from './DiagnosticsView';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-[#070B12] overflow-y-auto">
      <div className="flex justify-between items-center p-4 border-b border-[#23356E]">
        <h2 className="text-xl font-bold text-white">Diagnostics</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">Close</button>
      </div>
      <DiagnosticsView />
    </div>
  );
};
