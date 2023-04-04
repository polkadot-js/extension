// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const useNavigateOnChangeAccount = (path = DEFAULT_ROUTER_PATH) => {
  const navigate = useNavigate();

  const { currentAccount } = useSelector((state) => state.accountState);

  const [address] = useState(currentAccount?.address);

  useEffect(() => {
    if (currentAccount?.address !== address) {
      navigate(path);
    }
  }, [address, currentAccount?.address, navigate, path]);
};

export default useNavigateOnChangeAccount;
