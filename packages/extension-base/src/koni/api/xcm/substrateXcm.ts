// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { FOUR_INSTRUCTIONS_WEIGHT, getMultiLocationFromParachain, getReceiverLocation, POLKADOT_UNLIMITED_WEIGHT } from '@subwallet/extension-base/koni/api/xcm/utils';
import { _XCM_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _getSubstrateParaId, _getXcmAssetMultilocation, _isSubstrateParaChain } from '@subwallet/extension-base/services/chain-service/utils';

import { ApiPromise } from '@polkadot/api';

const NETWORK_USE_UNLIMITED_WEIGHT: string[] = ['acala', 'karura', 'statemint'];

export function substrateGetXcmExtrinsic (
  originNetworkKey: string,
  destinationNetworkKey: string,
  recipient: string,
  sendingValue: string,
  api: ApiPromise,
  originTokenInfo: _ChainAsset,
  chainInfoMap: Record<string, _ChainInfo>
) {
  // Case ParaChain -> RelayChain && Parachain -> Parachain
  if (_isSubstrateParaChain(chainInfoMap[originNetworkKey])) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const tokenIdentity = _getXcmAssetMultilocation(originTokenInfo);
    const weightParam = NETWORK_USE_UNLIMITED_WEIGHT.includes(originNetworkKey) ? POLKADOT_UNLIMITED_WEIGHT : FOUR_INSTRUCTIONS_WEIGHT;

    return api.tx.xTokens.transfer(
      tokenIdentity,
      sendingValue,
      getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, chainInfoMap, recipient),
      weightParam
    );
  }

  // Case RelayChain -> Parachain
  const destinationChainInfo = chainInfoMap[destinationNetworkKey];
  const receiverLocation: Record<string, any> = getReceiverLocation(originNetworkKey, destinationNetworkKey, chainInfoMap, recipient);

  if (_XCM_CHAIN_GROUP.statemine.includes(destinationNetworkKey)) {
    return api.tx.xcmPallet.limitedTeleportAssets(
      {
        V1: {
          parents: 0,
          interior: {
            X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
          }
        }
      },
      {
        V1: {
          parents: 0,
          interior: {
            X1: receiverLocation
          }
        }
      },
      {
        V1: [
          {
            id: { Concrete: { parents: 0, interior: 'Here' } },
            fun: { Fungible: sendingValue }
          }
        ]
      },
      0,
      POLKADOT_UNLIMITED_WEIGHT
    );
  }

  return api.tx.xcmPallet.reserveTransferAssets(
    {
      V1: { // find the destination chain
        parents: 0,
        interior: {
          X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
        }
      }
    },
    {
      V1: { // find the receiver
        parents: 0,
        interior: {
          X1: receiverLocation
        }
      }
    },
    {
      V1: [ // find the asset
        {
          id: {
            Concrete: { parents: 0, interior: 'Here' }
          },
          fun: { Fungible: sendingValue }
        }
      ]
    },
    0
  );
}
