// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* global chrome */

import React, { useCallback, useEffect, useState } from 'react';

import { ToastContext } from '../index.js';
import Toast from './Toast.js';

interface ToastProviderProps {
  children?: React.ReactNode;
}

const TOAST_TIMEOUT = 1500;
const ALARM_NAME = 'toastAlarm';

const ToastProvider = ({ children }: ToastProviderProps): React.ReactElement<ToastProviderProps> => {
  const [content, setContent] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const createAlarm = async () => {
      try {
        await chrome.alarms.create(ALARM_NAME, { delayInMinutes: TOAST_TIMEOUT / 60000 });
        chrome.alarms.onAlarm.addListener((alarm) => {
          if (alarm.name === ALARM_NAME) {
            setVisible(false);
          }
        });
      } catch (error) {
        console.error('Error creating the alarm:', error);
        throw error;
      }
    };

    createAlarm().then(async () => {
      return await chrome.alarms.clear(ALARM_NAME);
    }).catch((error) => console.error('Error clearing the alarm: ', error));
  }, []);

  const show = useCallback((message: string): (() => void) => {
    setContent(message);
    setVisible(true);

    return (): void => setVisible(false);
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
