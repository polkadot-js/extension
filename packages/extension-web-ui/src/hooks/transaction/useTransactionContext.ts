// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionContext } from '@subwallet/extension-web-ui/contexts/TransactionContext';
import { TransactionFormBaseProps } from '@subwallet/extension-web-ui/types';
import { useContext } from 'react';

const useTransactionContext = <T extends TransactionFormBaseProps>() => {
  const { closeAlert,
    closeRecheckChainConnectionModal, defaultData, goBack,
    modalId, needPersistData, onDone,
    openAlert,
    openRecheckChainConnectionModal,
    persistData,
    setBackProps, setCustomScreenTitle, setSubHeaderRightButtons } = useContext(TransactionContext);

  return {
    modalId,
    defaultData: defaultData as T,
    needPersistData,
    onDone,
    persistData,
    setSubHeaderRightButtons,
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
