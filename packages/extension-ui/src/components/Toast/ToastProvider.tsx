import React, { useState } from 'react';
import { ToastContext } from '..';
import Toast from './Toast';

interface ToastProviderProps {
  children?: React.ReactNode;
}

const TOAST_TIMEOUT = 1500;

const ToastProvider = ({ children }: ToastProviderProps): React.ReactElement<ToastProviderProps> => {
  const [content, setContent] = useState('');
  const [visible, setVisible] = useState(false);

  const show = (message: string): () => void => {
    const timerId = setTimeout(() => setVisible(false), TOAST_TIMEOUT);
    setContent(message);
    setVisible(true);
    return (): void => clearTimeout(timerId);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Toast content={content} visible={visible} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;

ToastProvider.displayName = 'Toast';
