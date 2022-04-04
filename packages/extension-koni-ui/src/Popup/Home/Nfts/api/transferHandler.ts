// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Common from 'ethereumjs-common';
import { Transaction } from 'ethereumjs-tx';
import Web3 from 'web3';

import { ApiPromise } from '@polkadot/api';
import { EVM_NETWORKS } from '@polkadot/extension-koni-base/api/endpoints';
import { TestERC721Contract } from '@polkadot/extension-koni-base/api/web3/web3';
import { SUPPORTED_TRANSFER_CHAIN_NAME, TRANSFER_CHAIN_ID, TransferResponse } from '@polkadot/extension-koni-ui/Popup/Home/Nfts/types';

async function acalaTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    const [info, extrinsic] = await Promise.all([
      api.tx.nft.transfer(recipientAddress, [collectionId, itemId]).paymentInfo(senderAddress),
      api.tx.nft.transfer(recipientAddress, [collectionId, itemId])
    ]);

    return {
      info,
      extrinsic
    } as TransferResponse;
  } catch (e) {
    console.log('error handling acala transfer nft', e);

    return null;
  }
}

async function rmrkTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const remark = params.remark as string;

    if (!remark) return {};

    const parsedRemark = remark.concat(recipientAddress.replace(
      /\\s/g,
      ''
    ));

    const [info, extrinsic] = await Promise.all([
      api.tx.system.remark(parsedRemark).paymentInfo(senderAddress),
      api.tx.system.remark(parsedRemark)
    ]);

    return {
      info,
      extrinsic
    } as TransferResponse;
  } catch (e) {
    console.log('error handling rmrk transfer nft', e);

    return null;
  }
}

async function uniqueTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    const [info, extrinsic] = await Promise.all([
      api.tx.nft.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1).paymentInfo(senderAddress), // 1 is amount
      api.tx.nft.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1)
    ]);

    return {
      info,
      extrinsic
    } as TransferResponse;
  } catch (e) {
    console.log('error handling unique transfer nft', e);

    return null;
  }
}

async function quartzTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    const [info, extrinsic] = await Promise.all([
      api.tx.unique.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1).paymentInfo(senderAddress),
      api.tx.unique.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1)
    ]);

    return {
      info,
      extrinsic
    } as TransferResponse;
  } catch (e) {
    console.log('error handling quartz transfer nft', e);

    return null;
  }
}

async function statemineTransferHandler (api: ApiPromise, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    const [info, extrinsic] = await Promise.all([
      api.tx.uniques.transfer(collectionId, itemId, recipientAddress).paymentInfo(senderAddress),
      api.tx.uniques.transfer(collectionId, itemId, recipientAddress)
    ]);

    return {
      info,
      extrinsic
    } as TransferResponse;
  } catch (e) {
    console.log('error handling statemine transfer nft', e);

    return null;
  }
}

async function web3TransferHandler (networkKey: string, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  const contractAddress = params.contractAddress as string;
  const tokenId = params.tokenId as string;

  try {
    const web3 = new Web3(new Web3.providers.WebsocketProvider(EVM_NETWORKS[networkKey].provider));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const contract = new web3.eth.Contract(TestERC721Contract, contractAddress);

    const [fromAccountTxCount, gasPriceGwei] = await Promise.all([
      web3.eth.getTransactionCount(senderAddress),
      web3.eth.getGasPrice()
    ]);

    // @ts-ignore
    const gasLimit = await web3.eth.estimateGas({
      // @ts-ignore
      nonce: '0x' + fromAccountTxCount.toString(16),
      from: senderAddress,
      gasPrice: web3.utils.toHex(gasPriceGwei),
      // to: contractAddress,
      value: '0x00'
    });

    const rawTransaction = {
      nonce: '0x' + fromAccountTxCount.toString(16),
      from: senderAddress,
      gasPrice: web3.utils.toHex(gasPriceGwei),
      gasLimit,
      to: contractAddress,
      value: '0x00',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      data: contract.methods.safeTransferFrom(senderAddress, recipientAddress, tokenId).encodeABI()
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const common = Common.forCustomChain('mainnet', {
      name: 'moonbase',
      networkId: TRANSFER_CHAIN_ID['moonbase'],
      chainId: TRANSFER_CHAIN_ID['moonbase']
    }, 'petersburg');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const tx = new Transaction(rawTransaction, { common });

    return {
      web3Tx: tx,
      estimatedGas: gasLimit * parseFloat(gasPriceGwei)
    } as TransferResponse;
  } catch (e) {
    console.log('error handling web3 transfer nft', e);

    return null;
  }
}

export default async function transferHandler (api: ApiPromise, networkKey: string, senderAddress: string, recipientAddress: string, params: Record<string, any>): Promise<TransferResponse | null> {
  switch (networkKey) {
    case SUPPORTED_TRANSFER_CHAIN_NAME.acala:
      return await acalaTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.karura:
      return await acalaTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.kusama:
      return await rmrkTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.uniqueNft:
      return await uniqueTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.quartz:
      return await quartzTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.opal:
      return await quartzTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.statemine:
      return await statemineTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.statemint:
      return await statemineTransferHandler(api, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.moonbase:
      return await web3TransferHandler(networkKey, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.moonbeam:
      return await web3TransferHandler(networkKey, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_CHAIN_NAME.moonriver:
      return await web3TransferHandler(networkKey, senderAddress, recipientAddress, params);
  }

  return null;
}
