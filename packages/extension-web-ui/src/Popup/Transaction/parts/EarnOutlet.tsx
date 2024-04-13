// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LoadingScreen, PageWrapper } from '@subwallet/extension-web-ui/components';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useChainConnection, useSetCurrentPage, useTransactionContext } from '@subwallet/extension-web-ui/hooks';
import { StoreName } from '@subwallet/extension-web-ui/stores';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children: React.ReactNode | React.ReactNode[];
  path: string;
  stores: StoreName[];
  autoEnableChain?: boolean;
}

const Component: React.FC<Props> = (props: Props) => {
  const { autoEnableChain, children, className, path, stores } = props;
  const { isWebUI } = useContext(ScreenContext);

  useSetCurrentPage(path);

  const dataContext = useContext(DataContext);
  const { inactiveModal } = useContext(ModalContext);

  const { defaultData } = useTransactionContext();
  const navigate = useNavigate();
  const { checkChainConnected, turnOnChain } = useChainConnection();

  const isChainActive = checkChainConnected(defaultData.chain);

  useEffect(() => {
    if (!isChainActive && autoEnableChain && defaultData.chain) {
      turnOnChain(defaultData.chain);
    }
  }, [autoEnableChain, defaultData.chain, isChainActive, turnOnChain]);

  useEffect(() => {
    if (!isChainActive && !autoEnableChain) {
      navigate('/home/earning');
    }
  }, [autoEnableChain, inactiveModal, isChainActive, navigate]);

  if (!isChainActive) {
    return <LoadingScreen />;
  }

  return (
    <PageWrapper
      className={CN(className, 'page-wrapper', {
        '-is-desktop': isWebUI
      })}
      resolve={dataContext.awaitStores(stores)}
    >
      {children}
    </PageWrapper>
  );
};

const EarnOutlet = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    height: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };
});

export default EarnOutlet;
