// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LoadingScreen } from '@subwallet/extension-web-ui/components';
import { CREATE_RETURN, DEFAULT_ROUTER_PATH, DEFAULT_SWAP_PARAMS, SWAP_PATH, SWAP_TRANSACTION } from '@subwallet/extension-web-ui/constants';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { isAccountAll } from '@subwallet/extension-web-ui/utils';
import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  const navigate = useNavigate();
  const isNoAccount = useSelector((state) => state.accountState.isNoAccount);
  const [, setReturnStorage] = useLocalStorage(CREATE_RETURN, DEFAULT_ROUTER_PATH);
  const [, setSwapStorage] = useLocalStorage(SWAP_TRANSACTION, DEFAULT_SWAP_PARAMS);
  const currentAccount = useSelector((root) => root.accountState.currentAccount);
  const { feature } = useParams();

  const transactionFromValue = useMemo(() => {
    return currentAccount?.address ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';
  }, [currentAccount?.address]);

  useEffect(() => {
    if (feature === 'swap') {
      if (isNoAccount) {
        setReturnStorage(SWAP_PATH);
        navigate(DEFAULT_ROUTER_PATH);
      } else {
        setSwapStorage({
          ...DEFAULT_SWAP_PARAMS,
          from: transactionFromValue
        });
        navigate(SWAP_PATH);
      }
    }
  }, [feature, isNoAccount, navigate, setReturnStorage, setSwapStorage, transactionFromValue]);

  return (
    <LoadingScreen />
  );
};

const RedirectHandler = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
  };
});

export default RedirectHandler;
