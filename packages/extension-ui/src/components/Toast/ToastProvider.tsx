// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';

import { ToastContext } from '../index.js';
import Toast from './Toast.js';

interface ToastProviderProps {
  children?: React.ReactNode;
}

const TOAST_TIMEOUT = 1500;

const ToastProvider = ({ children }: ToastProviderProps): React.ReactElement<ToastProviderProps> => {
  const [content, setContent] = useState('');
  const [visible, setVisible] = useState(false);

  const show = useCallback((message: string): () => void => {
    const timerId = setTimeout(() => setVisible(false), TOAST_TIMEOUT);

    setContent(message);
    setVisible(true);

    return (): void => clearTimeout(timerId);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Toast
        content={content}
        visible={visible}
      />
    </ToastContext.Provider>
  );
};

export default ToastProvider;

ToastProvider.displayName = 'Toast';
