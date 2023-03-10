// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getSubstrateParaId, _getXcmAssetMultilocation, _isChainEvmCompatible, _isSubstrateRelayChain } from '@subwallet/extension-base/services/chain-service/utils';
import { KeyringPair } from '@subwallet/keyring/types';

import { ApiPromise } from '@polkadot/api';
import { decodeAddress } from '@polkadot/util-crypto';

// const ASSET_TO_LOCATION_MAP: Record<string, Record<string, Record<string, any>>> = {
//   astar: {
//     '18446744073709551617': { // aUSD
//       parents: 1, interior: { X2: [{ Parachain: 2000 }, { GeneralKey: '0x0001' }] }
//     },
//     '340282366920938463463374607431768211455': { // DOT
//       parents: 1, interior: 'Here'
//     }
//   },
//   shiden: {
//     '18446744073709551616': { // aUSD
//       parents: 1, interior: { X2: [{ Parachain: 2000 }, { GeneralKey: '0x0081' }] }
//     },
//     '340282366920938463463374607431768211455': {
//       parents: 1, interior: 'Here'
//     }
//   }
// };

export async function astarEstimateCrossChainFee (
  originNetworkKey: string,
  destinationNetworkKey: string,
  recipient: string,
  sender: KeyringPair,
  sendingValue: string,
  substrateApiMap: Record<string, _SubstrateApi>,
  originTokenInfo: _ChainAsset,
  chainInfoMap: Record<string, _ChainInfo>
): Promise<string> {
  const substrateApi = await substrateApiMap[originNetworkKey].isReady;
  const destinationChainInfo = chainInfoMap[destinationNetworkKey];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const assetLocation = _getXcmAssetMultilocation(originTokenInfo);

  let receiverLocation: Record<string, any> = { AccountId32: { network: 'Any', id: decodeAddress(recipient) } };
  let destinationChainLocation: Record<string, any> = {
    V1: { // find the destination chain
      parents: 1,
      interior: {
        X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
      }
    }
  };

  if (_isChainEvmCompatible(destinationChainInfo)) {
    receiverLocation = { AccountKey20: { network: 'Any', id: recipient } };
  }

  if (_isSubstrateRelayChain(destinationChainInfo)) { // check if sending to relaychain
    destinationChainLocation = {
      V1: { // find the destination chain
        parents: 1,
        interior: 'Here'
      }
    };
  }

  const extrinsic = substrateApi.api.tx.polkadotXcm.reserveWithdrawAssets(
    destinationChainLocation,
    {
      V1: { // find the receiver
        parents: 0, // parents for beneficiary is always 0
        interior: {
          X1: receiverLocation
        }
      }
    },
    {
      V1: [ // find the asset
        {
          id: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            Concrete: assetLocation
          },
          fun: { Fungible: sendingValue }
        }
      ]
    },
    0
  );

  console.log('astar xcm tx here', extrinsic.toHex());

  const paymentInfo = await extrinsic.paymentInfo(sender);

  return paymentInfo.partialFee.toString();
}

export function astarGetXcmExtrinsic (
  originNetworkKey: string,
  destinationNetworkKey: string,
  recipient: string,
  sendingValue: string,
  api: ApiPromise,
  originTokenInfo: _ChainAsset,
  chainInfoMap: Record<string, _ChainInfo>
) {
  const destinationChainInfo = chainInfoMap[destinationNetworkKey];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const assetLocation = _getXcmAssetMultilocation(originTokenInfo);

  let receiverLocation: Record<string, any> = { AccountId32: { network: 'Any', id: decodeAddress(recipient) } };
  let destinationChainLocation: Record<string, any> = {
    V1: { // find the destination chain
      parents: 1,
      interior: {
        X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
      }
    }
  };

  if (_isChainEvmCompatible(destinationChainInfo)) {
    receiverLocation = { AccountKey20: { network: 'Any', id: recipient } };
  }

  if (_isSubstrateRelayChain(destinationChainInfo)) {
    destinationChainLocation = {
      V1: { // find the destination chain
        parents: 1,
        interior: 'Here'
      }
    };
  }

  return api.tx.polkadotXcm.reserveWithdrawAssets(
    destinationChainLocation,
    {
      V1: { // find the receiver
        parents: 0, // parents for beneficiary is always 0
        interior: {
          X1: receiverLocation
        }
      }
    },
    {
      V1: [ // find the asset
        {
          id: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            Concrete: assetLocation
          },
          fun: { Fungible: sendingValue }
        }
      ]
    },
    0
  );
}
