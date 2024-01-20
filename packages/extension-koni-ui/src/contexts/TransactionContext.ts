// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionFormBaseProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps } from '@subwallet/react-ui';
import React, { Dispatch, SetStateAction } from 'react';

export interface TransactionContextProps{
  defaultData: TransactionFormBaseProps;
  persistData: Dispatch<SetStateAction<TransactionFormBaseProps>>;
  needPersistData: boolean;
  onDone: (extrinsicHash: string) => void;
  setSubHeaderRightButtons: Dispatch<SetStateAction<ButtonProps[] | undefined>>;
  goBack: () => void;
  setOnBack: Dispatch<SetStateAction<VoidFunction>>;
  setDisableBack: Dispatch<SetStateAction<boolean>>;
}

export const TransactionContext = React.createContext<TransactionContextProps>({
  defaultData: { from: '', chain: '', asset: '' },
  needPersistData: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  persistData: (value) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onDone: (extrinsicHash) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setSubHeaderRightButtons: (value) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  goBack: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setOnBack: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisableBack: () => {}
});
