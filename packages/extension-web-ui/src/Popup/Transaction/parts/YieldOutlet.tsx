// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LoadingScreen, PageWrapper } from '@subwallet/extension-web-ui/components';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { useSelector, useSetCurrentPage, useTransactionContext } from '@subwallet/extension-web-ui/hooks';
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
}

const Component: React.FC<Props> = (props: Props) => {
  const { children, className, path, stores } = props;

  useSetCurrentPage(path);

  const dataContext = useContext(DataContext);
  const { inactiveModal } = useContext(ModalContext);

  const { defaultData, modalId } = useTransactionContext();
  const navigate = useNavigate();

  const { chainStateMap } = useSelector((state) => state.chainStore);

  const isChainActive = chainStateMap[defaultData.chain].active;

  useEffect(() => {
    if (!isChainActive) {
      if (modalId) {
        inactiveModal(modalId);
      } else {
        navigate('/home/earning');
      }
    }
  }, [inactiveModal, isChainActive, modalId, navigate]);

  if (!isChainActive) {
    return <LoadingScreen />;
  }

  return (
    <PageWrapper
      className={CN(className, 'page-wrapper')}
      resolve={dataContext.awaitStores(stores)}
    >
      {children}
    </PageWrapper>
  );
};

const YieldOutlet = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default YieldOutlet;
