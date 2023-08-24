// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionContext } from '@subwallet/extension-koni-ui/contexts/TransactionContext';
import { TransactionFormBaseProps } from '@subwallet/extension-koni-ui/types';
import { useContext } from 'react';

const useTransactionContext = <T extends TransactionFormBaseProps>() => {
  const { defaultData, needPersistData, onClickRightBtn, onDone, persistData, setDisabledRightBtn, setShowRightBtn } = useContext(TransactionContext);

  return {
    defaultData: defaultData as T,
    needPersistData,
    onDone,
    persistData,
    setDisabledRightBtn,
    setShowRightBtn,
    onClickRightBtn
  };
};

export default useTransactionContext;
