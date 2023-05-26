// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import { noop } from 'rxjs';

import { SnackbarTypes } from '../../types';
import { ToastContext } from '..';
import { TOAST_TIMEOUT } from './consts';
import Toast from './Toast';

interface ToastProviderProps {
  children?: React.ReactNode;
}

const ToastProvider = ({ children }: ToastProviderProps): React.ReactElement<ToastProviderProps> => {
  const [content, setContent] = useState('');
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<SnackbarTypes>('info');

  const [timerId, setTimerId] = useState<NodeJS.Timeout>();

  const show = useCallback(
    (message: string, type: SnackbarTypes = 'info'): (() => void) => {
      if (visible) {
        return noop;
      }

      const timerId = setTimeout(() => {
        setVisible(false);
      }, TOAST_TIMEOUT);

      setTimerId(timerId);
      setContent(message);
      setVisible(true);

      if (type) {
        setType(type);
      }

      return (): void => {
        clearTimeout(timerId);
      };
    },
    [visible]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Toast
        content={content}
        setVisible={setVisible}
        toastTimeout={timerId}
        type={type}
        visible={visible}
      />
    </ToastContext.Provider>
  );
};

export default ToastProvider;

ToastProvider.displayName = 'Toast';
