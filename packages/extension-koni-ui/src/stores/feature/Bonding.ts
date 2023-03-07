// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit/dist';
import { ChainBondingInfo } from '@subwallet/extension-base/background/KoniTypes';
import { BondingStore, ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';

const initialState = {
  chainBondingInfoMap: {
    polkadot: {
      estimatedReturn: 15,
      activeNominatorCount: 21816,
      totalNominatorCount: 22500,
      unbondingPeriod: 28 * 24,
      totalStake: '1000000000000000000'
    }
  },
  validatorInfoMap: {
    polkadot: [
      {
        address: '5CFWZcRb5xbKQqtWRTsijz3RVrR6Gx2oQksNhoGuDdpc5G42',
        chain: 'polkadot',
        totalStake: '100000000000',
        ownStake: '123198590',
        otherStake: '129103859058',
        nominatorCount: 140,
        commission: 10,
        expectedReturn: 10,
        locked: false,
        identity: 'SubWallet test',
        isVerified: true,
        minBond: '100000000000'
      },
      {
        address: '5CXR5cKUySBJGksuLn2hbUTUMxm2uT9z3QWaU8Nmm4DG9Jhe',
        chain: 'polkadot',
        totalStake: '100000000000',
        ownStake: '123198590',
        otherStake: '129103859058',
        nominatorCount: 140,
        commission: 10,
        expectedReturn: 10,
        locked: false,
        identity: 'SubWallet test 1',
        isVerified: true,
        minBond: '100000000000'
      }
    ]
  },
  nominationPoolInfoMap: {
    polkadot: [
      {
        id: '39',
        chain: 'polkadot',
        address: '5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc',
        memberCount: 100,
        bondedAmount: '129103859058',
        identity: 'SubWallet Pool'
      },
      {
        id: '90',
        chain: 'polkadot',
        address: '5HbcEs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc',
        memberCount: 100,
        bondedAmount: '129103859058',
        identity: 'Test Pool'
      }
    ]
  },
  nominatorInfo: {
    '5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc_polkadot': {
      chain: 'polkadot',
      address: '5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc',
      isBondedBefore: true,
      bondedValidators: ['5CFWZcRb5xbKQqtWRTsijz3RVrR6Gx2oQksNhoGuDdpc5G42'],
      bondedPool: ['39']
    }
  }
} as unknown as BondingStore;

const bondingSlice = createSlice({
  initialState,
  name: 'bonding',
  reducers: {
    updateChainBondingInfoMap (state, action: PayloadAction<Record<string, ChainBondingInfo>>) {
      const payload = action.payload;

      return {
        chainBondingInfoMap: payload,
        validatorInfoMap: state.validatorInfoMap,
        nominationPoolInfoMap: state.nominationPoolInfoMap,
        nominatorInfo: state.nominatorInfo,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateChainBondingInfoMap } = bondingSlice.actions;
export default bondingSlice.reducer;
