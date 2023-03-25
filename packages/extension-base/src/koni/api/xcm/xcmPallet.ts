// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { FOUR_INSTRUCTIONS_WEIGHT, getBeneficiary, NETWORK_USE_UNLIMITED_WEIGHT, POLKADOT_UNLIMITED_WEIGHT } from '@subwallet/extension-base/koni/api/xcm/utils';
import { _getSubstrateParaId } from '@subwallet/extension-base/services/chain-service/utils';

import { ApiPromise } from '@polkadot/api';

function getDestinationChainLocation (destinationChainInfo: _ChainInfo) {
  return {
    V1: {
      parents: 0,
      interior: {
        X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
      }
    }
  };
}

function getTokenLocation (sendingValue: string) {
  return { // always native token of relaychain
    V1: [
      {
        id: { Concrete: { parents: 0, interior: 'Here' } },
        fun: { Fungible: sendingValue }
      }
    ]
  };
}

// this pallet is only used by Relaychains
export function getExtrinsicByXcmPalletPallet (tokenInfo: _ChainAsset, originChainInfo: _ChainInfo, destinationChainInfo: _ChainInfo, recipientAddress: string, value: string, api: ApiPromise) {
  const weightParam = NETWORK_USE_UNLIMITED_WEIGHT.includes(originChainInfo.slug) ? POLKADOT_UNLIMITED_WEIGHT : FOUR_INSTRUCTIONS_WEIGHT;
  const destination = getDestinationChainLocation(destinationChainInfo);
  const beneficiary = getBeneficiary(originChainInfo, destinationChainInfo, recipientAddress);
  const tokenLocation = getTokenLocation(value);

  let method = 'limitedReserveTransferAssets';

  if (['statemint', 'statemine'].includes(destinationChainInfo.slug)) {
    method = 'limitedTeleportAssets';
  }

  return api.tx.xcmPallet[method](
    destination,
    beneficiary,
    tokenLocation,
    0,
    weightParam
  );
}
