// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { getReceiverLocation, POLKADOT_UNLIMITED_WEIGHT } from '@subwallet/extension-base/koni/api/xcm/utils';
import { _getSubstrateParaId, _getXcmAssetMultilocation, _isSubstrateParaChain } from '@subwallet/extension-base/services/chain-service/utils';

import { ApiPromise } from '@polkadot/api';

export function statemintGetXcmExtrinsic (
  originNetworkKey: string,
  destinationNetworkKey: string,
  recipient: string,
  sendingValue: string,
  api: ApiPromise,
  originTokenInfo: _ChainAsset,
  chainInfoMap: Record<string, _ChainInfo>
) {
  const destinationChainInfo = chainInfoMap[destinationNetworkKey];
  const receiverLocation: Record<string, any> = getReceiverLocation(originNetworkKey, destinationNetworkKey, chainInfoMap, recipient);

  if (_isSubstrateParaChain(destinationChainInfo)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const assetLocation = _getXcmAssetMultilocation(originTokenInfo);
    const destinationChainLocation: Record<string, any> = {
      V1: { // find the destination chain
        parents: 1,
        interior: {
          X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
        }
      }
    };

    return api.tx.polkadotXcm.limitedReserveTransferAssets(
      destinationChainLocation, // dest
      {
        V1: { // beneficiary
          parents: 0,
          interior: {
            X1: receiverLocation
          }
        }
      },
      {
        V1: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  X2: assetLocation
                }
              }
            },
            fun: { Fungible: sendingValue }
          }
        ]
      },
      0, // FeeAssetItem
      POLKADOT_UNLIMITED_WEIGHT
    );
  } else {
    return api.tx.polkadotXcm.limitedTeleportAssets(
      {
        V1: {
          parents: 1,
          interior: 'Here'
        }
      }, // dest
      {
        V1: { // beneficiary
          parents: 0,
          interior: {
            X1: receiverLocation
          }
        }
      },
      {
        V1: [
          {
            id: {
              Concrete: {
                parents: 1,
                interior: 'Here' // Native token of relaychain
              }
            },
            fun: { Fungible: sendingValue }
          }
        ]
      },
      0, // FeeAssetItem
      POLKADOT_UNLIMITED_WEIGHT
    );
  }
}
