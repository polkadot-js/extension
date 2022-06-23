// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SigData } from '@subwallet/extension-koni-ui/types/accountExternalRequest';
import React, { useCallback } from 'react';

import { SignerResult } from '@polkadot/types/types/extrinsic';

interface ExternalRequestContextType {
  createResolveExternalRequestData: (data: SigData) => SignerResult;
}

export const ExternalRequestContext = React.createContext({} as ExternalRequestContextType);

interface ExternalRequestContextProviderProps {
  children?: React.ReactElement;
}

let id = 1;

export const ExternalRequestContextProvider = ({ children }: ExternalRequestContextProviderProps) => {
  const createResolveExternalRequestData = useCallback((data: SigData): SignerResult => {
    return ({
      id: id++,
      signature: data.signature
    });
  }, []);

  return (
    <ExternalRequestContext.Provider
      value = {{
        createResolveExternalRequestData: createResolveExternalRequestData
      }}
    >
      {children}
    </ExternalRequestContext.Provider>
  );
};
