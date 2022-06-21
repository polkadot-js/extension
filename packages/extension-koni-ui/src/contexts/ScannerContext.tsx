// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createTransactionFromRLP, Transaction } from '@subwallet/extension-koni-base/utils/eth';
import { SCANNER_QR_STEP } from '@subwallet/extension-koni-ui/constants/scanner';
import { AccountContext } from '@subwallet/extension-koni-ui/contexts/index';
import { qrSignEvm, qrSignSubstrate } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { CompletedParsedData, EthereumParsedData, MessageQRInfo, MultiFramesInfo, QrInfo, SubstrateCompletedParsedData, SubstrateMessageParsedData, SubstrateTransactionParsedData, TxQRInfo } from '@subwallet/extension-koni-ui/types/scanner';
import { constructDataFromBytes, encodeNumber } from '@subwallet/extension-koni-ui/util/decoders';
import { getNetworkJsonByGenesisHash } from '@subwallet/extension-koni-ui/util/getNetworkJsonByGenesisHash';
import { isEthereumCompletedParsedData, isSubstrateMessageParsedData } from '@subwallet/extension-koni-ui/util/scanner';
import BigN from 'bignumber.js';
import React, { useCallback, useContext, useReducer } from 'react';
import { useSelector } from 'react-redux';

import { GenericExtrinsicPayload } from '@polkadot/types';
import { compactFromU8a, hexToU8a, isAscii, isHex, isU8a, u8aConcat, u8aToHex } from '@polkadot/util';
import { keccakAsHex } from '@polkadot/util-crypto';

type ScannerStoreState = {
  busy: boolean;
  completedFramesCount: number;
  dataToSign: string | Uint8Array;
  isHash: boolean;
  isOversized: boolean;
  latestFrame: number | null;
  message: string | null;
  missedFrames: Array<number>;
  multipartData: null | Array<Uint8Array | null>;
  multipartComplete: boolean;
  rawPayload: Uint8Array | string | null;
  recipientAddress: string | null;
  senderAddress: string | null;
  signedData: string;
  genesisHash?: string;
  evmChainId?: number;
  specVersion: number;
  totalFrameCount: number;
  tx: Transaction | GenericExtrinsicPayload | string | Uint8Array | null;
  type: 'transaction' | 'message' | null;
  step: number;
  isEthereum: boolean;
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
  signDataLegacy: (savePass: boolean, password: string) => Promise<void>;
};

const DEFAULT_STATE: ScannerStoreState = {
  busy: false,
  completedFramesCount: 0,
  dataToSign: '',
  isHash: false,
  isOversized: false,
  latestFrame: null,
  message: null,
  missedFrames: [],
  multipartComplete: false,
  multipartData: null,
  rawPayload: null,
  recipientAddress: null,
  senderAddress: null,
  signedData: '',
  specVersion: Number.MAX_SAFE_INTEGER,
  totalFrameCount: 0,
  tx: null,
  type: null,
  step: SCANNER_QR_STEP.SCAN_STEP,
  isEthereum: false
};

export const ScannerContext = React.createContext({} as ScannerContextType);

const MULTIPART = new Uint8Array([0]); // always mark as multipart for simplicity's sake. Consistent with @polkadot/react-qr

// const SIG_TYPE_NONE = new Uint8Array();
// const SIG_TYPE_ED25519 = new Uint8Array([0]);
const SIG_TYPE_SR25519 = new Uint8Array([1]);
// const SIG_TYPE_ECDSA = new Uint8Array([2]);

interface ScannerContextProviderProps {
  children?: React.ReactElement;
}

export function ScannerContextProvider ({ children }: ScannerContextProviderProps): React.ReactElement {
  const { getAccountByAddress } = useContext(AccountContext);
  const { networkMap } = useSelector((state: RootState) => state);

  const initialState = DEFAULT_STATE;

  const reducer = (state: ScannerStoreState,
    delta: Partial<ScannerStoreState>): ScannerStoreState => ({
    ...state,
    ...delta
  });
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
        throw new Error('part data is not completed');
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

    return (constructDataFromBytes(concatMultipartData, true, networkMap)) as SubstrateCompletedParsedData;
  }, [networkMap]);

  const setPartData = useCallback((currentFrame: number, frameCount: number, partData: string): MultiFramesInfo | SubstrateCompletedParsedData => {
    const newArray = Array.from({ length: frameCount }, () => null);
    const totalFrameCount = frameCount;

    if (!state.multipartData) {
      throw Error('');
    }

    // set it once only
    const multipartData = !state.totalFrameCount
      ? newArray
      : state.multipartData;
    const { completedFramesCount, multipartComplete } = state;
    const partDataAsBytes = new Uint8Array(partData.length / 2);

    for (let i = 0; i < partDataAsBytes.length; i++) {
      partDataAsBytes[i] = parseInt(partData.substr(i * 2, 2), 16);
    }

    if (currentFrame === 0 && (partDataAsBytes[0] === new Uint8Array([0x00])[0] || partDataAsBytes[0] === new Uint8Array([0x7b])[0])) {
      // part_data for frame 0 MUST NOT begin with byte 00 or byte 7B.
      throw new Error('Error decoding invalid part data.');
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
    }

    return {
      completedFramesCount: totalFrameCount,
      missedFrames: [],
      totalFrameCount
    };
  }, [_integrateMultiPartData, state]);

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
        recipientAddress = tx.action;
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

    const sender = getAccountByAddress(networkMap, txRequest.data.account, genesisHash);

    if (!sender) {
      throw new Error(`No private key found for account ${txRequest.data.account}.`);
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

    const specVersion = (txRequest as SubstrateTransactionParsedData).data.specVersion || Number.MAX_SAFE_INTEGER;

    setState({
      ...qrInfo,
      rawPayload: (txRequest as SubstrateTransactionParsedData)?.data.rawPayload,
      specVersion,
      genesisHash: genesisHash,
      isEthereum,
      evmChainId
    });

    return qrInfo;
  }, [networkMap, getAccountByAddress, setBusy]);

  const _setDataToSign = useCallback((signRequest: SubstrateMessageParsedData | EthereumParsedData): MessageQRInfo => {
    setBusy();

    const address = signRequest.data.account;
    const genesisHash = (signRequest as SubstrateMessageParsedData).data.genesisHash;
    let message = '';
    let isHash = false;
    let isOversized = false;
    let dataToSign = '';
    let isEthereum = false;

    if (isSubstrateMessageParsedData(signRequest)) {
      if (signRequest.data.crypto !== 'sr25519') {
        throw new Error('Stylo only supports accounts using sr25519 crypto');
      }

      isHash = signRequest.isHash;
      isOversized = signRequest.oversized;
      dataToSign = signRequest.data.data;
      message = dataToSign;
    } else {
      message = signRequest.data.data;
      isEthereum = true;

      /// need check
      // dataToSign = ethSign(message);
    }

    const sender = getAccountByAddress(networkMap, address, genesisHash);

    if (!sender) {
      throw new Error(`No account found in Stylo for: ${address}.`);
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
      isEthereum
    });

    return qrInfo;
  }, [networkMap, getAccountByAddress, setBusy]);

  const setData = useCallback((unsignedData: CompletedParsedData): QrInfo => {
    if (unsignedData !== null) {
      switch (unsignedData.action) {
        case 'signTransaction':
          return _setTXRequest(unsignedData);
        case 'signData':
          return _setDataToSign(unsignedData);
        default:
          throw new Error('Scanned QR should contain either extrinsic or a message to sign');
      }
    } else {
      throw new Error('Scanned QR should contain either extrinsic or a message to sign');
    }
  }, [_setDataToSign, _setTXRequest]);

  // signing data with legacy account.
  const signDataLegacy = useCallback(async (savePass: boolean, password = ''): Promise<void> => {
    const { dataToSign, evmChainId, genesisHash, isEthereum, isHash, senderAddress, type } = state;
    const sender = !!senderAddress && getAccountByAddress(networkMap, senderAddress, genesisHash);

    if (!sender) {
      throw new Error('Signing Error: sender could not be found.');
    }

    if (!type) {
      throw new Error('Signing Error: type could not be found.');
    }

    const senderNetwork = getNetworkJsonByGenesisHash(networkMap, genesisHash);
    const networkIsEthereum = senderNetwork && (senderNetwork.isEthereum);

    let signedData;

    if (isEthereum) {
      let signable;

      if (isU8a(dataToSign)) {
        signable = u8aToHex(dataToSign);
      } else if (isHex(dataToSign)) {
        signable = dataToSign;
      } else {
        throw new Error('Signing Error: cannot signing message');
      }

      const { signature } = await qrSignEvm(senderAddress, password, signable, type, evmChainId);

      signedData = signature;
    } else {
      let signable;

      if (dataToSign instanceof GenericExtrinsicPayload) {
        signable = u8aToHex(dataToSign.toU8a(true));
      } else if (isHash) {
        console.log('sign legacy data type is', typeof dataToSign);
        signable = dataToSign.toString();
      } else if (isU8a(dataToSign)) {
        signable = u8aToHex(dataToSign);
      } else if (isAscii(dataToSign)) {
        signable = dataToSign;
      } else {
        throw new Error('Signing Error: cannot signing message');
      }

      // signable is hex with prefix

      let signed: string;

      try {
        const { signature } = await qrSignSubstrate(senderAddress, signable, savePass, password);

        signed = signature;
      } catch (e) {
        console.error(e);
        throw new Error((e as Error).message);
      }

      // Tweak the first byte if and when network is evm
      const sig = networkIsEthereum ? u8aConcat(hexToU8a(signed)) : u8aConcat(SIG_TYPE_SR25519, hexToU8a(signed));

      signedData = u8aToHex(sig, -1, false); // the false doesn't add 0x
    }

    setState({ signedData, step: SCANNER_QR_STEP.FINAL_STEP });
  }, [getAccountByAddress, networkMap, state]);

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
}
