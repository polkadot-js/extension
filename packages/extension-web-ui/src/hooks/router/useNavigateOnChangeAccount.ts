// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-web-ui/constants/router';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const useNavigateOnChangeAccount = (path = DEFAULT_ROUTER_PATH, active = true) => {
  const navigate = useNavigate();

  const { currentAccount } = useSelector((state) => state.accountState);

  const address = useRef(currentAccount?.address);

  useEffect(() => {
    if (currentAccount?.address !== address.current) {
      active && navigate(path);
      address.current = currentAccount?.address;
    }
  }, [active, currentAccount?.address, navigate, path]);
};

export default useNavigateOnChangeAccount;
