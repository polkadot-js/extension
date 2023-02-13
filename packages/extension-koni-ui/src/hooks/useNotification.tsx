// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NotificationContext, NotificationProps } from '@subwallet/react-ui/es/notification/NotificationProvider';
import { useContext } from 'react';

export default function useNotification (): (props: NotificationProps) => void {
  return useContext(NotificationContext).showNotification;
}
