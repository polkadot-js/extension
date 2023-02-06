// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SnackbarTypes, ThemeProps } from '../../types';

import React, { useCallback } from 'react';
import styled from 'styled-components';

import * as icons from './iconsList';
import ToastCloseIcon from './ToastCloseIcon';
import { TOAST_TIMEOUT } from './ToastProvider';

interface Props extends ThemeProps {
  content: React.ReactNode;
  className?: string;
  type: SnackbarTypes;
}

function Toast({ className, content, type }: Props): React.ReactElement<Props> {
  const _getIconByType = useCallback((type: SnackbarTypes): string => icons?.[type] ?? icons.info, []);

  return (
    <div className={className}>
      <div>
        <img
          className='snackbar-icon'
          src={_getIconByType(type)}
        />
      </div>
      <div className='snackbar-content'>{content}</div>
      <div className='snackbar-close'>
        <ToastCloseIcon animationDurationInSeconds={TOAST_TIMEOUT / 1000} />
      </div>
    </div>
  );
}

export default styled(Toast)<{ visible: boolean }>`
  position: fixed;
  display: ${({ visible }): string => (visible ? 'flex' : 'none')};
  height: 72px;
  bottom: 8px;
  left: 8px;
  right: 8px;
  flex-direction: row;
  align-items: center;
  border-radius: 4px;
  box-shadow: ${({ theme }: Props): string => theme.toastBoxShadow};;
  gap: 14px;
  color : ${({ theme }: Props): string => theme.toastTextColor};
  isolation: isolate;
  width: 344px;
  padding: 16px;
  box-sizing: border-box;
  animation: toast 0.2s, toast  0.2s linear 1.4s reverse;

  @keyframes toast {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

  .snackbar-content {
    max-width: 200px;
  }

  .snackbar-close {
    display: flex;
    position: absolute;
    /* due to padding */
    right: -16px;
  }
  
  && {
    border-radius: 4px;
    background: ${({ theme, type }: Props): string =>
      type === 'success'
        ? theme.toastSuccessBackground
        : type === 'warning'
        ? theme.toastWarningBackground
        : type === 'critical'
        ? theme.toastCriticalBackground
        : theme.toastInfoBackground};
  }
  
`;
