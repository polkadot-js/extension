// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CREATE_RETURN } from '@subwallet/extension-web-ui/constants';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-web-ui/constants/router';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from 'usehooks-ts';

const useCompleteCreateAccount = () => {
  const navigate = useNavigate();

  const { isNoAccount } = useSelector((state: RootState) => state.accountState);

  const [returnPath, setReturnStorage] = useLocalStorage(CREATE_RETURN, DEFAULT_ROUTER_PATH);

  return useCallback(() => {
    if (isNoAccount) {
      navigate('/create-done');
    } else {
      navigate(returnPath, { state: { from: returnPath } });
      setReturnStorage(DEFAULT_ROUTER_PATH);
    }
  }, [isNoAccount, navigate, returnPath, setReturnStorage]);
};

export default useCompleteCreateAccount;
