// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NotificationContext, NotificationProps } from '@subwallet/react-ui/es/notification/NotificationProvider';
import React, { useCallback, useContext, useMemo } from 'react';

export default function useNotification (): (props: NotificationProps) => void {
  const { showNotification } = useContext(NotificationContext);

  const key = useMemo((): React.Key => {
    return Date.now();
  }, []);

  return useCallback((props: NotificationProps) => {
    showNotification({
      key,
      closable: true,
      duration: 3,
      ...props
    });
  }, [key, showNotification]);
}
