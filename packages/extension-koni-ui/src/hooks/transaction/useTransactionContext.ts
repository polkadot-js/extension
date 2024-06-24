// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionContext } from '@subwallet/extension-koni-ui/contexts/TransactionContext';
import { TransactionFormBaseProps } from '@subwallet/extension-koni-ui/types';
import { useContext } from 'react';

const useTransactionContext = <T extends TransactionFormBaseProps>() => {
  const { closeAlert,
    closeRecheckChainConnectionModal, defaultData, goBack,
    needPersistData, onDone, openAlert,
    openRecheckChainConnectionModal,
    persistData,
    setBackProps,
    setCustomScreenTitle,
    setIsDisableHeader, setSubHeaderRightButtons } = useContext(TransactionContext);

  return {
    defaultData: defaultData as T,
    needPersistData,
    onDone,
    persistData,
    setSubHeaderRightButtons,
    setIsDisableHeader,
    goBack,
    setBackProps,
    closeAlert,
    closeRecheckChainConnectionModal,
    openAlert,
    openRecheckChainConnectionModal,
    setCustomScreenTitle
  };
};

export default useTransactionContext;
