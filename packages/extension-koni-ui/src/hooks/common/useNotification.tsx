// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NotificationContext, NotificationProps } from '@subwallet/react-ui/es/notification/NotificationProvider';
import React, { useCallback, useContext, useMemo, useRef } from 'react';

export default function useNotification (): (props: NotificationProps) => void {
  const { showNotification } = useContext(NotificationContext);

  const timeoutRef = useRef<NodeJS.Timer>();

  const key = useMemo((): React.Key => {
    return Date.now();
  }, []);

  return useCallback((props: NotificationProps) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      showNotification({
        key,
        closable: true,
        ...props
      });
    }, 100);
  }, [key, showNotification]);
}
