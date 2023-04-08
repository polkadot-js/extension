// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useGetAccountByAddress from "@subwallet-webapp/hooks/account/useGetAccountByAddress";
import { AccountSignMode } from "@subwallet-webapp/types/account";
import { getSignMode } from "@subwallet-webapp/util/account/account";
import { useMemo } from "react";

const useGetAccountSignModeByAddress = (address?: string): AccountSignMode => {
  const account = useGetAccountByAddress(address);

  return useMemo((): AccountSignMode => {
    return getSignMode(account);
  }, [account]);
};

export default useGetAccountSignModeByAddress;
