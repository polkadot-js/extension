// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';

import { SnackbarTypes } from '../../types';
import { ToastContext } from '..';
import Toast from './Toast';

interface ToastProviderProps {
  children?: React.ReactNode;
}

export const TOAST_TIMEOUT = 1500;

const ToastProvider = ({ children }: ToastProviderProps): React.ReactElement<ToastProviderProps> => {
  const [content, setContent] = useState('');
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<SnackbarTypes>('info');

  const show = useCallback((message: string, type: SnackbarTypes = 'info'  ): () => void => {
    const timerId = setTimeout(() => setVisible(false), TOAST_TIMEOUT);

    setContent(message);
    setVisible(true);

    if(type){
      setType(type);
    }

    return (): void => clearTimeout(timerId);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Toast
        content={content}
        type={type}
        visible={visible}
      />
    </ToastContext.Provider>
  );
};

export default ToastProvider;

ToastProvider.displayName = 'Toast';
