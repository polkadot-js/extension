// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';

interface SelectAccount {
  availableAccounts: string[];
  selectedAccounts: string[];
}

const useSelectWalletConnectAccount = (namespaces: string[]) => {
  const [result, setResult] = useState<Record<string, SelectAccount>>({});

  

  useEffect(() => {

  }, []);
};

export default useSelectWalletConnectAccount;
