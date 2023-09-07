// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResponseParseTransactionSubstrate, ResponseQrParseRLP, SignerDataType } from '@subwallet/extension-base/background/KoniTypes';
import { _isChainEnabled } from '@subwallet/extension-base/services/chain-service/utils';
import { createTransactionFromRLP, Transaction } from '@subwallet/extension-base/utils/eth';
import { MULTIPART, SCANNER_QR_STEP } from '@subwallet/extension-koni-ui/constants';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { parseEVMTransaction, parseSubstrateTransaction, qrSignEvm, qrSignSubstrate } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { CompletedParsedData, EthereumParsedData, MessageQRInfo, MultiFramesInfo, QrInfo, SubstrateCompletedParsedData, SubstrateMessageParsedData, SubstrateTransactionParsedData, TxQRInfo } from '@subwallet/extension-koni-ui/types/scanner';
import { constructDataFromBytes, encodeNumber, findAccountByAddress, getNetworkJsonByInfo, isEthereumCompletedParsedData, isSubstrateMessageParsedData } from '@subwallet/extension-koni-ui/utils';
import BigN from 'bignumber.js';
import React, { useCallback, useReducer } from 'react';
import { useSelector } from 'react-redux';

import { GenericExtrinsicPayload } from '@polkadot/types';
import { compactFromU8a, hexStripPrefix, isAscii, isHex, isString, isU8a, u8aConcat, u8aToHex } from '@polkadot/util';
import { isEthereumAddress, keccakAsHex } from '@polkadot/util-crypto';

type ScannerStoreState = {
  busy: boolean;
  completedFramesCount: number;
  dataToSign: string | Uint8Array;
  evmChainId?: number;
  genesisHash?: string;
  isEthereumStructure: boolean;
  isHash: boolean;
  isOversized: boolean;
  latestFrame: number | null;
  message: string | null;
  missedFrames: Array<number>;
  multipartComplete: boolean;
  multipartData: null | Array<Uint8Array | null>;
  parsedTx: ResponseParseTransactionSubstrate | ResponseQrParseRLP | null;
  rawPayload: Uint8Array | string | null;
  recipientAddress: string | null;
  senderAddress: string | null;
  signedData: string;
  step: number;
  totalFrameCount: number;
  tx: Transaction | GenericExtrinsicPayload | string | Uint8Array | null;
  type: SignerDataType | null;
};

export type ScannerContextType = {
  cleanup: () => void;
  clearMultipartProgress: () => void;
  setBusy: () => void;
  setReady: () => void;
  state: ScannerStoreState;
  setPartData: (currentFrame: number, frameCount: number, partData: string) => MultiFramesInfo | SubstrateCompletedParsedData;
  setData: (unsignedData: CompletedParsedData) => QrInfo;
  setStep: (step: number) => void;
  signDataLegacy: () => Promise<void>;
};

const DEFAULT_STATE: ScannerStoreState = {
  busy: false,
  completedFramesCount: 0,
  dataToSign: '',
  isEthereumStructure: false,
  isHash: false,
  isOversized: false,
  latestFrame: null,
  message: null,
  missedFrames: [],
  multipartComplete: false,
  multipartData: null,
  parsedTx: null,
  rawPayload: null,
  recipientAddress: null,
  senderAddress: null,
  signedData: '',
  step: SCANNER_QR_STEP.SCAN_STEP,
  totalFrameCount: 0,
  tx: null,
  type: null
};

export const ScannerContext = React.createContext({} as ScannerContextType);

// const SIG_TYPE_NONE = new Uint8Array();
// const SIG_TYPE_ED25519 = new Uint8Array([0]);
// const SIG_TYPE_SR25519 = new Uint8Array([1]);
// const SIG_TYPE_ECDSA = new Uint8Array([2]);

interface ScannerContextProviderProps {
  children?: React.ReactElement;
}

const initialState = DEFAULT_STATE;

const reducer = (state: ScannerStoreState,
  delta: Partial<ScannerStoreState>): ScannerStoreState => {
  return Object.assign({}, state, delta);
};

export const ScannerContextProvider = ({ children }: ScannerContextProviderProps): React.ReactElement => {
  const { t } = useTranslation();

  const accounts = useSelector((state: RootState) => state.accountState.accounts);
  const { chainInfoMap, chainStateMap } = useSelector((state: RootState) => state.chainStore);

  const [state, setState] = useReducer(reducer, initialState);

  const setStep = useCallback((value: number) => {
    setState({ step: value });
  }, []);

  const setBusy = useCallback((): void => {
    setState({ busy: true });
  }, []);

  const _integrateMultiPartData = useCallback((multipartData: Array<Uint8Array | null>, totalFrameCount: number): SubstrateCompletedParsedData => {
    // concatenate all the parts into one binary blob
    let concatMultipartData = multipartData.reduce((acc: Uint8Array, part: Uint8Array | null): Uint8Array => {
      if (part === null) {
        throw new Error(t('Incomplete. Please continue scanning'));
      }

      const c = new Uint8Array(acc.length + part.length);

      c.set(acc);
      c.set(part, acc.length);

      return c;
    },
    new Uint8Array(0));

    // unshift the frame info
    const frameInfo = u8aConcat(MULTIPART,
      encodeNumber(totalFrameCount),
      encodeNumber(0));

    concatMultipartData = u8aConcat(frameInfo, concatMultipartData);

    return (constructDataFromBytes(concatMultipartData, true, chainInfoMap, chainStateMap, accounts)) as SubstrateCompletedParsedData;
  }, [t, chainInfoMap, chainStateMap, accounts]);

  const setPartData = useCallback((currentFrame: number, frameCount: number, partData: string): MultiFramesInfo | SubstrateCompletedParsedData => {
    const newArray = Array.from({ length: frameCount }, () => null);
    const totalFrameCount = frameCount;

    // set it once only
    const multipartData = !state.totalFrameCount ? newArray : state.multipartData || newArray;
    const { completedFramesCount, multipartComplete } = state;
    const partDataAsBytes = new Uint8Array(partData.length / 2);

    for (let i = 0; i < partDataAsBytes.length; i++) {
      partDataAsBytes[i] = parseInt(partData.substr(i * 2, 2), 16);
    }

    if (currentFrame === 0 && (partDataAsBytes[0] === new Uint8Array([0x00])[0] || partDataAsBytes[0] === new Uint8Array([0x7b])[0])) {
      // part_data for frame 0 MUST NOT begin with byte 00 or byte 7B.
      throw new Error(t('Failed to decrypt data'));
    }

    if (completedFramesCount < totalFrameCount) {
      // we haven't filled all the frames yet
      const nextDataState = multipartData;

      nextDataState[currentFrame] = partDataAsBytes;

      const nextMissedFrames: number[] = [];

      nextDataState.forEach((current: Uint8Array | null, index: number) => {
        if (current === null) {
          nextMissedFrames.push(index + 1);
        }
      });

      const nextCompletedFramesCount = totalFrameCount - nextMissedFrames.length;

      setState({
        completedFramesCount: nextCompletedFramesCount,
        latestFrame: currentFrame,
        missedFrames: nextMissedFrames,
        multipartData: nextDataState,
        totalFrameCount
      });

      if (totalFrameCount > 0 && nextCompletedFramesCount === totalFrameCount && !multipartComplete) {
        // all the frames are filled
        return _integrateMultiPartData(nextDataState, totalFrameCount);
      }

      return {
        completedFramesCount: nextCompletedFramesCount,
        missedFrames: nextMissedFrames,
        totalFrameCount
      };
    } else {
      return _integrateMultiPartData(multipartData, totalFrameCount);
    }

    return {
      completedFramesCount: totalFrameCount,
      missedFrames: [],
      totalFrameCount
    };
  }, [_integrateMultiPartData, state, t]);

  const setReady = useCallback((): void => {
    setState({ busy: false });
  }, []);

  const _setTXRequest = useCallback((txRequest: EthereumParsedData | SubstrateTransactionParsedData): TxQRInfo => {
    setBusy();

    const isOversized = (txRequest as SubstrateCompletedParsedData)?.oversized || false;
    const isEthereum = isEthereumCompletedParsedData(txRequest);
    let genesisHash: string | undefined;

    if (isEthereum && !(txRequest.data && (txRequest).data.rlp && txRequest.data.account)) {
      throw new Error('Scanned QR contains no valid extrinsic');
    }

    let tx, recipientAddress, dataToSign, evmChainId;

    if (isEthereum) {
      if (txRequest.data.rlp) {
        tx = createTransactionFromRLP(txRequest.data.rlp);

        if (!tx) {
          throw new Error('Cannot parse rlp transaction');
        }

        evmChainId = new BigN(tx.ethereumChainId).toNumber();
        recipientAddress = tx.to;
        dataToSign = txRequest.data.rlp;
      } else {
        tx = '';
        recipientAddress = '';
        dataToSign = keccakAsHex(txRequest.data.rlp);
      }
    } else {
      if (txRequest.oversized) {
        dataToSign = txRequest.data.data;
      } else {
        const payloadU8a = txRequest.data.data;
        const [offset] = compactFromU8a(payloadU8a);

        dataToSign = payloadU8a.subarray(offset);
      }

      // those 2 only make sense for ETH
      recipientAddress = '';
      tx = '';
      genesisHash = txRequest.data.genesisHash;
    }

    const sender = findAccountByAddress(accounts, txRequest.data.account);

    if (!sender) {
      throw new Error('Account has not been imported into this device. Please import an account and try again.');
    }

    const qrInfo: TxQRInfo = {
      dataToSign,
      isHash: (txRequest as SubstrateTransactionParsedData)?.isHash || false,
      isOversized,
      recipientAddress,
      senderAddress: txRequest.data.account,
      tx,
      type: 'transaction'
    };

    setState({
      ...qrInfo,
      rawPayload: (txRequest as SubstrateTransactionParsedData)?.data.rawPayload,
      genesisHash: genesisHash,
      isEthereumStructure: isEthereum,
      evmChainId
    });

    return qrInfo;
  }, [accounts, setBusy]);

  const _setDataToSign = useCallback((signRequest: SubstrateMessageParsedData | EthereumParsedData): MessageQRInfo => {
    setBusy();

    const address = signRequest.data.account;
    const genesisHash = (signRequest as SubstrateMessageParsedData).data.genesisHash;
    let message = '';
    let isHash = false;
    let isOversized = false;
    let dataToSign = '';
    let isEthereumStructure = false;

    if (isSubstrateMessageParsedData(signRequest)) {
      if (signRequest.data.crypto !== 'sr25519') {
        throw new Error(t('SubWallet only supports accounts using sr25519 crypto'));
      }

      isHash = signRequest.isHash;
      isOversized = signRequest.oversized;
      dataToSign = signRequest.data.data;
      message = dataToSign;
    } else {
      dataToSign = signRequest.data.data;
      message = signRequest.data.data;
      isEthereumStructure = true;
    }

    const sender = findAccountByAddress(accounts, address);

    if (!sender) {
      throw new Error(t('Unable to find account'));
    }

    const qrInfo: MessageQRInfo = {
      dataToSign,
      isHash,
      isOversized,
      message: message.toString(),
      senderAddress: sender.address,
      type: 'message'
    };

    setState({
      ...qrInfo,
      genesisHash: genesisHash,
      isEthereumStructure: isEthereumStructure
    });

    return qrInfo;
  }, [t, accounts, setBusy]);

  const setData = useCallback((unsignedData: CompletedParsedData): QrInfo => {
    if (unsignedData !== null) {
      switch (unsignedData.action) {
        case 'signTransaction':
          return _setTXRequest(unsignedData);
        case 'signData':
          return _setDataToSign(unsignedData);
        default:
          throw new Error(t('Invalid QR code'));
      }
    } else {
      throw new Error(t('Invalid QR code'));
    }
  }, [t, _setDataToSign, _setTXRequest]);

  // signing data with legacy account.
  const signDataLegacy = useCallback(async (): Promise<void> => {
    const { dataToSign, evmChainId, genesisHash, isEthereumStructure, isHash, rawPayload, senderAddress, type } = state;
    const sender = !!senderAddress && findAccountByAddress(accounts, senderAddress);
    const info: undefined | number | string = isEthereumStructure ? evmChainId : genesisHash;
    const senderNetwork = getNetworkJsonByInfo(chainInfoMap, isEthereumAddress(senderAddress || ''), isEthereumStructure, info);
    const senderNetworkState = chainStateMap[senderNetwork?.slug || ''];

    if (!senderNetwork) {
      throw new Error('Failed to sign. Network not found');
    }

    if (!_isChainEnabled(senderNetworkState)) {
      throw new Error(t('Inactive network. Please enable {{networkName}} on this device and try again', { replace: { networkName: senderNetwork.name?.replace(' Relay Chain', '') } }));
    }

    if (!sender) {
      throw new Error(t('Failed to sign. Sender account not found'));
    }

    if (!type) {
      throw new Error(t('Failed to sign. Unable to detect type'));
    }

    const signData = async (): Promise<string> => {
      if (isEthereumStructure) {
        let signable;

        if (isU8a(dataToSign)) {
          signable = u8aToHex(dataToSign);
        } else if (isHex(dataToSign)) {
          signable = dataToSign;
        } else if (isAscii(dataToSign)) {
          signable = dataToSign;
        } else if (isHash) {
          signable = dataToSign;
        } else {
          throw new Error(t('Failed to sign. Invalid message type'));
        }

        const { signature } = await qrSignEvm({
          address: senderAddress,
          message: signable,
          type: type,
          chainId: evmChainId
        });

        return signature;
      } else {
        let signable;

        if (dataToSign instanceof GenericExtrinsicPayload) {
          signable = u8aToHex(dataToSign.toU8a(true));
        } else if (isU8a(dataToSign)) {
          signable = u8aToHex(dataToSign);
        } else if (isAscii(dataToSign) || isHash) {
          signable = dataToSign;
        } else {
          throw new Error(t('Failed to sign. Invalid message type'));
        }

        try {
          const { signature } = await qrSignSubstrate({
            address: senderAddress,
            data: signable,
            networkKey: senderNetwork.slug
          });

          if (type === 'message') {
            return hexStripPrefix(signature).substring(2);
          }

          return hexStripPrefix(signature);
        } catch (e) {
          console.error(e);
          throw new Error((e as Error).message);
        }
      }
    };

    const parseTransaction = async (): Promise<ResponseQrParseRLP | ResponseParseTransactionSubstrate | null> => {
      if (type === 'message') {
        return null;
      } else {
        if (!isEthereumStructure) {
          if (genesisHash && rawPayload) {
            const _rawPayload = isString(rawPayload) ? rawPayload : u8aToHex(rawPayload);

            return parseSubstrateTransaction({ data: _rawPayload, networkKey: senderNetwork.slug });
          } else {
            return null;
          }
        } else {
          if (dataToSign) {
            const _raw = isString(dataToSign) ? dataToSign : u8aToHex(dataToSign);

            return await parseEVMTransaction(_raw);
          } else {
            return null;
          }
        }
      }
    };

    const [signedData, parsedTx] = await Promise.all([signData(), parseTransaction()]);

    setState({ signedData, parsedTx, step: SCANNER_QR_STEP.FINAL_STEP });
  }, [t, accounts, chainInfoMap, chainStateMap, state]);

  const clearMultipartProgress = useCallback((): void => {
    setState({
      completedFramesCount: DEFAULT_STATE.completedFramesCount,
      latestFrame: DEFAULT_STATE.latestFrame,
      missedFrames: DEFAULT_STATE.missedFrames,
      multipartComplete: DEFAULT_STATE.multipartComplete,
      multipartData: null,
      totalFrameCount: DEFAULT_STATE.totalFrameCount
    });
  }, []);

  const cleanup = useCallback((): void => {
    setState({ ...DEFAULT_STATE });
  }, []);

  return (
    <ScannerContext.Provider
      value={{
        cleanup,
        clearMultipartProgress,
        setBusy,
        setData,
        setPartData,
        setReady,
        setStep,
        signDataLegacy,
        state
      }}
    >
      {children}
    </ScannerContext.Provider>
  );
};
