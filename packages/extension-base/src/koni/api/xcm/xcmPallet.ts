// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { getBeneficiary, getDestWeight } from '@subwallet/extension-base/koni/api/xcm/utils';
import { _getSubstrateParaId } from '@subwallet/extension-base/services/chain-service/utils';

import { ApiPromise } from '@polkadot/api';

function getDestinationChainLocation (destinationChainInfo: _ChainInfo, version = 'V1') {
  return {
    [version]: {
      parents: 0,
      interior: {
        X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
      }
    }
  };
}

function getTokenLocation (sendingValue: string, version = 'V2') {
  return { // always native token of relaychain
    [version]: [
      {
        id: { Concrete: { parents: 0, interior: 'Here' } },
        fun: { Fungible: sendingValue }
      }
    ]
  };
}

// this pallet is only used by Relaychains
export function getExtrinsicByXcmPalletPallet (tokenInfo: _ChainAsset, originChainInfo: _ChainInfo, destinationChainInfo: _ChainInfo, recipientAddress: string, value: string, api: ApiPromise) {
  const weightParam = getDestWeight();
  const xcmVer = ['kusama'].includes(originChainInfo.slug) ? 'V2' : 'V1';
  const destination = getDestinationChainLocation(destinationChainInfo, xcmVer);
  const beneficiary = getBeneficiary(originChainInfo, destinationChainInfo, recipientAddress, xcmVer);
  const tokenLocation = getTokenLocation(value, xcmVer);

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
