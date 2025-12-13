import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'success', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Barre de progression
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        if (newProgress <= 0) {
          clearInterval(progressInterval);
          return 0;
        }
        return newProgress;
      });
    }, 100);

    // Timer pour fermer automatiquement
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const styles = {
    success: {
      bg: 'bg-green-500',
      icon: '✓',
      progressBg: 'bg-green-700'
    },
    error: {
      bg: 'bg-red-500',
      icon: '✕',
      progressBg: 'bg-red-700'
    },
    info: {
      bg: 'bg-blue-500',
      icon: 'ℹ',
      progressBg: 'bg-blue-700'
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: '⚠',
      progressBg: 'bg-yellow-700'
    }
  };

  const currentStyle = styles[type] || styles.success;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`${currentStyle.bg} text-white px-6 py-4 rounded-lg shadow-lg min-w-[300px] max-w-md`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl flex-shrink-0">{currentStyle.icon}</span>
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 text-xl leading-none flex-shrink-0"
          >
            ✕
          </button>
        </div>
        {/* Barre de progression */}
        <div className="mt-3 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
          <div
            className={`h-full ${currentStyle.progressBg} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Toast;

