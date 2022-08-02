// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { getMultiLocationFromParachain, xTokenMoonbeamContract } from '@subwallet/extension-koni-base/api/xcm/utils';
import { DOTSAMA_AUTO_CONNECT_MS } from '@subwallet/extension-koni-base/constants';
import { getCurrentProvider } from '@subwallet/extension-koni-base/utils/utils';
import Web3 from 'web3';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { BN, bnToHex, u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

jest.setTimeout(50000);

describe('test DotSama APIs', () => {
  test('test xcm from substrate parachain - evm parachain', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.acala_testnet), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;
    const weight = 4000000000;
    const fromAddress = '5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc';
    const toAddress = '0x40a207109cf531024B55010A1e760199Df0d3a13';

    const tx = apiPromise.tx.xTokens.transfer(
      {
        Token: 'AUSD'
      },
      new BN(1),
      {
        V1: {
          parents: 1,
          interior: {
            X2: [
              {
                Parachain: 1000
              },
              {
                AccountKey20: {
                  network: 'Any',
                  key: toAddress
                }
              }
            ]
          }
        }
      },
      weight
    );

    const fee = await tx.paymentInfo(fromAddress);

    console.log(fee.partialFee.toHuman());

    console.log((10 ** 12));
  });

  // eslint-disable-next-line @typescript-eslint/require-await
  test('test xcm from moonbeam - substrate parachain', async () => {
    const web3 = new Web3(getCurrentProvider(PREDEFINED_NETWORKS.moonbeam));

    let targetParachain = bnToHex(2001).slice(2); // Bifrost Alphanet

    targetParachain = '0x0000000000'.slice(0, -targetParachain.length) + targetParachain;
    const accountHex = u8aToHex(decodeAddress('ettAyhG3qXgvc6tFbofxYzQSdXBMzXMehB1TmmSEQd8SxvJ'));
    const targetAccount = accountHex.replace('0x', '0x01') + '00';
    const destination = [1, [targetParachain, targetAccount]];
    const weight = 4000000000;

    console.log('Destination', JSON.stringify(destination));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const xTokenContract = new web3.eth.Contract(xTokenMoonbeamContract);

    // Encode transfer
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const transferData = xTokenContract.methods.transfer('0xAF2b4242e766caf5791DA56723a8dE1BeA4e7098', 1, destination, weight).encodeABI();

    console.log(transferData);

    // // Estimate gas fee
    // const gasPrice = await web3.eth.getGasPrice();
    //
    // console.log(gasPrice);
    //
    // const transactionObject = {
    //   from: fromAcc.address,
    //   to: contractAddress,
    //   gasPrice: gasPrice,
    //   data: transferData
    // };
    // const gasLimit = await web3.eth.estimateGas(transactionObject);
    //
    // if (gasLimit) {
    //   transactionObject.gas = gasLimit;
    // }
    //
    // // Perform Transaction
    // const signed = await web3.eth.accounts.signTransaction(transactionObject, fromAcc.privateKey);
    //
    // try {
    //   web3.eth.sendSignedTransaction(signed.rawTransaction)
    //     .on('transactionHash', function (hash) {
    //       console.log('transactionHash', hash);
    //     })
    //     .on('receipt', function (receipt) {
    //       console.log('receipt', receipt);
    //     });
    // } catch (e) {
    //   console.log(e.message);
    // }
  });

  test('test get moonbeam xcm', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.moonbase), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiProps = await api.isReady;

    const extrinsic = apiProps.tx.xTokens.transfer(
      { ForeignAsset: '42259045809535163221576417993425387648' },
      '1000000000000',
      {
        V1: {
          parents: 1,
          interior: {
            X1: { AccountId32: { network: 'Any', id: '5DLiz4E7znANe9LMWyFHPQvmdhSgdJeoJdgtFtEZ8c3TeBan' } }
          }
        }
      },
      4000000000
    );

    console.log(extrinsic.toHex());

    const paymentInfo = await extrinsic.paymentInfo('0x40a207109cf531024B55010A1e760199Df0d3a13');

    console.log(paymentInfo.toHuman());
  });

  test('test get multilocation', () => {
    const res = getMultiLocationFromParachain('moonbeam', 'polkadot', PREDEFINED_NETWORKS, 'oakiscoais');

    console.log(res);
  });

  test('test get xcm transfer from relay -> parachain', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.moonbase_relay), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiProps = await api.isReady;
    const decimals = PREDEFINED_NETWORKS.moonbase_relay.decimals as number;

    const extrinsic = apiProps.tx.xcmPallet.reserveTransferAssets(
      {
        V1: {
          parents: 0,
          interior: {
            X1: {
              Parachain: 1000
            }
          }
        }
      },
      {
        V1: {
          parents: 0,
          interior: {
            X1: {
              AccountKey20: {
                network: 'Any',
                key: '0x40a207109cf531024b55010a1e760199df0d3a13'
              }
            }
          }
        }
      },
      {
        V1: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: 'Here'
              }
            },
            fun: {
              Fungible: '2000000000000'
            }
          }
        ]
      },
      0
    );

    console.log(extrinsic.toHex());

    const info = await extrinsic.paymentInfo('5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc');

    const rawFee = info.partialFee.toString();
    const parsedFee = parseFloat(rawFee) / 10 ** decimals;

    console.log(parsedFee);
  });

  test('test get moonbeam xcm to relay chain', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.moonbase), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiProps = await api.isReady;

    const extrinsic = apiProps.tx.xTokens.transferMultiasset( // can be substitution for transfer()
      {
        V1: {
          id: {
            Concrete: {
              parents: 1,
              interior: 'Here'
            }
          },
          fun: {
            Fungible: '10000000000000'
          }
        }
      },
      {
        V1: {
          parents: 1,
          interior: {
            X1: {
              AccountId32: {
                network: 'Any',
                id: '5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc'
              }
            }
          }
        }
      },
      4000000000
    );

    console.log(extrinsic.toHex());
  });

  test('test get astar xcm to parachain', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.astar), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiProps = await api.isReady;

    const assetLocation = await api.query.xcAssetConfig.assetIdToLocation('18446744073709551617');

    console.log(assetLocation.toHuman());

    const extrinsic = apiProps.tx.polkadotXcm.reserveWithdrawAssets( // can be substitution for transfer()
      {
        V1: { // find the destination chain
          parents: 0,
          interior: {
            X1: { Parachain: 2000 }
          }
        }
      },
      {
        V1: { // find the receiver
          parents: 0,
          interior: {
            X1: { AccountId32: { network: 'Any', id: decodeAddress('5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc') } }
          }
        }
      },
      {
        V1: [ // find the asset
          {
            id: {
              Concrete: {
                parents: 1,
                interior: {
                  X2: [
                    {
                      Parachain: 2000
                    },
                    {
                      GeneralKey: '0x0001'
                    }
                  ]
                }
              }
            },
            fun: { Fungible: '100000000000000' }
          }
        ]
      },
      0
    );

    console.log(extrinsic.toHex());
  });
});
