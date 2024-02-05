// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit/dist';
import { BondingStore, ChainNominationPoolParams, ChainValidatorParams, ReduxStatus } from '@subwallet/extension-web-ui/stores/types';

const initialState = {
  validatorInfoMap: {},
  nominationPoolInfoMap: {}
} as BondingStore;

const bondingSlice = createSlice({
  initialState,
  name: 'bonding',
  reducers: {
    updateChainValidators (state, action: PayloadAction<ChainValidatorParams>) {
      const payload = action.payload;

      return {
        validatorInfoMap: {
          ...state.validatorInfoMap,
          [payload.chain]: payload.validators
        },
        nominationPoolInfoMap: state.nominationPoolInfoMap,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateNominationPools (state, action: PayloadAction<ChainNominationPoolParams>) {
      const payload = action.payload;

      return {
        nominationPoolInfoMap: {
          ...state.nominationPoolInfoMap,
          [payload.chain]: payload.pools
        },
        validatorInfoMap: state.validatorInfoMap,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateChainValidators } = bondingSlice.actions;
export default bondingSlice.reducer;
