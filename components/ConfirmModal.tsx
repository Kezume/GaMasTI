"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
}

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "warning" }: ConfirmModalProps) {
  const icons = {
    danger: <FiAlertTriangle className="text-red-400" />,
    warning: <FiAlertTriangle className="text-yellow-400" />,
    info: <FiInfo className="text-blue-400" />,
    success: <FiCheckCircle className="text-green-400" />,
  };

  const iconBg = {
    danger: "bg-red-500/20",
    warning: "bg-yellow-500/20",
    info: "bg-blue-500/20",
    success: "bg-green-500/20",
  };

  const buttonColors = {
    danger: "bg-red-500 hover:bg-red-600",
    warning: "bg-yellow-500 hover:bg-yellow-600",
    info: "bg-blue-500 hover:bg-blue-600",
    success: "bg-green-500 hover:bg-green-600",
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-gray-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6">
              {/* Close Button */}
              <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                <FiX className="text-xl" />
              </button>

              {/* Icon */}
              <div className={`w-16 h-16 ${iconBg[type]} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <div className="text-3xl">{icons[type]}</div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white text-center mb-3">{title}</h3>

              {/* Message */}
              <p className="text-gray-300 text-center mb-6 leading-relaxed">{message}</p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                  {cancelText}
                </button>
                <button onClick={handleConfirm} className={`flex-1 ${buttonColors[type]} text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg`}>
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
