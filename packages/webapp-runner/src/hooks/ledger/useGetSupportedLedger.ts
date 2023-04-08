// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from "@subwallet-webapp/stores";
import { getSupportedLedger } from "@subwallet-webapp/util/account/ledger";
import { useMemo } from "react";
import { useSelector } from "react-redux";

const useGetSupportedLedger = () => {
  const { chainStateMap } = useSelector((state: RootState) => state.chainStore);

  return useMemo(() => getSupportedLedger(chainStateMap), [chainStateMap]);
};

export default useGetSupportedLedger;
