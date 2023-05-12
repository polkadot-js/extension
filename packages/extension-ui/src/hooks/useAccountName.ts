// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useContext } from "react";

import { AccountContext } from "../components";

const useAccountName = (selectedAddress: string) => {
  const { accounts } = useContext(AccountContext);

  return accounts.find(({ address }) => address === selectedAddress)?.name;
};

export default useAccountName;
