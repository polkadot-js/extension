// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { getBeneficiary, getDestinationChainLocation, getDestWeight, getTokenLocation } from '@subwallet/extension-base/koni/api/xcm/utils';
import { _isSubstrateRelayChain } from '@subwallet/extension-base/services/chain-service/utils';

import { ApiPromise } from '@polkadot/api';

export function getExtrinsicByPolkadotXcmPallet (tokenInfo: _ChainAsset, originChainInfo: _ChainInfo, destinationChainInfo: _ChainInfo, recipientAddress: string, value: string, api: ApiPromise) {
  const weightParam = getDestWeight();
  const version = ['statemint', 'statemine', 'shiden', 'astar'].includes(originChainInfo.slug) ? 'V3' : 'V1';
  const beneficiary = getBeneficiary(destinationChainInfo, recipientAddress, version);
  const destination = getDestinationChainLocation(originChainInfo, destinationChainInfo, version);
  let assetLocation = getTokenLocation(tokenInfo, value, version);

  let method = 'limitedReserveTransferAssets';

  if (['statemint', 'statemine'].includes(originChainInfo.slug) && _isSubstrateRelayChain(destinationChainInfo)) {
    assetLocation = {
      [version]: [
        {
          id: { Concrete: { parents: 1, interior: 'Here' } },
          fun: { Fungible: value }
        }
      ]
    };
    method = 'limitedTeleportAssets';
  }

  return api.tx.polkadotXcm[method](
    destination,
    beneficiary,
    assetLocation,
    0, // FeeAssetItem
    weightParam
  );
}
