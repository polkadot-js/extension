// Copyright 2019-2023 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { InjectedAccount, InjectedExtension, InjectedMetadata, InjectedMetadataKnown, InjectedWindowProvider, MetadataDef } from "@polkadot/extension-inject/types";
import type { KeypairType } from "@polkadot/util-crypto/types";
import type { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import type { SignerResult } from '@polkadot/api/types/index.js';
import type { GetSnapsResponse, Snap, SnapRpcRequestParams } from "./types";
import { DEFAULT_SNAP_ORIGIN, DEFAULT_SNAP_NAME, DEFAULT_SNAP_VERSION, SUPPORTED_SNAPS } from "./defaults.js";
import { hasMetamask } from "./utils.js";

export default class Metadata implements InjectedMetadata {
  public get(): Promise<InjectedMetadataKnown[]> {
    return getMetaDataList();
  }

  public provide(definition: MetadataDef): Promise<boolean> {
    return setMetadata(definition);
  }
}

/** @internal Requests permission for a dapp to communicate with the specified Snaps and attempts to install them if they're not already installed. */
const connectSnap = async () => {
  return await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: SUPPORTED_SNAPS,
  });
};

/** @internal Retrieves information about installed Snaps available for communication. */
const getSnaps = async (): Promise<GetSnapsResponse> => {
  return (await window.ethereum.request({
    method: 'wallet_getSnaps',
  })) as unknown as GetSnapsResponse;
};

/**  @internal Retrieves information about a specific Snap based on its ID and version. */
const getSnap = async (_id: string = DEFAULT_SNAP_ORIGIN, _version?: string): Promise<Snap | undefined> => {
  if (!hasMetamask) {
    return undefined;
  }

  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      ({ id, version }) =>
        id === _id && (!_version || version === _version),
    );
  } catch (e) {
    console.log('Failed to obtain installed snap', e);
    return undefined;
  }
};

/** @internal Invokes a method on a Snap and returns the result. */
const invokeSnap = async (args: SnapRpcRequestParams) => {
  console.info('args in invokeSnap:', args)
  const result = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: args?.snapId || DEFAULT_SNAP_ORIGIN,
      request: {
        method: args.method,
        params: args?.params,
      },
    },
  });

  return result as unknown as any;
};

/** @internal Gets the list of Snap accounts available in the connected wallet. */
const getSnapAccounts = async (
  anyType?: boolean,
): Promise<InjectedAccount[]> => {
  const _addressAnyChain = await invokeSnap({
    method: 'getAddress',
    params: { anyType }, // if we can have chainName here, we can show formatted address to users
  });

  const account = {
    address: _addressAnyChain,
    name: 'Metamask account 1 🍻',
    type: 'sr25519' as KeypairType,
  };

  return [account];
};

/** @internal Requests the Snap to sign a JSON payload with the connected wallet. */
const requestSignJSON = async (
  payload: SignerPayloadJSON,
): Promise<SignerResult> => {
  return await invokeSnap({
    method: 'signJSON',
    params: { payload },
  });
};

/** @internal Requests the Snap to sign a raw payload with the connected wallet. */
const requestSignRaw = async (
  raw: SignerPayloadRaw,
): Promise<SignerResult> => {
  return await invokeSnap({
    method: 'signRaw',
    params: { raw },
  });
};

/**
 * @summary Retrieves a list of known metadata related to Polkadot eco chains.
 * @description
 * This function sends a request to the connected Snap to retrieve a list of known metadata.
 * The metadata includes information about Polkadot eco chains and other relevant details.
 * This information is stored and retrieved from the local state of Metamask Snaps.
 */
export const getMetaDataList = async (): Promise<InjectedMetadataKnown[]> => {
  return await invokeSnap({
    method: 'getMetadataList',
    params: {},
  });
};

/**
 * @summary Sets metadata related to Polkadot eco chains using Metamask Snaps.
 * @description
 * This function sends a request to the connected Snap to set metadata.
 * The provided `metaData` object contains the information to be set. This data is stored using
 * the local state of Metamask Snaps for future use.
 */
export const setMetadata = async (metaData: MetadataDef): Promise<boolean> => {
  return await invokeSnap({
    method: 'setMetadata',
    params: {
      metaData
    },
  });
};

/** @internal Creates a subscription manager for notifying subscribers about changes in injected accounts. */
export const snapSubscriptionManager = () => {
  let subscribers: ((accounts: InjectedAccount[]) => void | Promise<void>)[] = [];

  /** Subscribe to changes in injected accounts. The callback function to be invoked when changes in injected accounts occur. */
  const subscribe = (callback: (accounts: InjectedAccount[]) => void | Promise<void>) => {
    subscribers.push(callback);

    return () => {
      subscribers = subscribers.filter((subscriber) => subscriber !== callback);

      getSnapAccounts()
      .then(callback)
      .catch(console.error);
    };
  };

  /** Notify all subscribers about changes in injected accounts. */
  const notifySubscribers = (accounts: InjectedAccount[]) => {
    subscribers.forEach((callback) => callback(accounts));
  };

  return { subscribe, notifySubscribers };
};

/** @internal This object encapsulates the functionality of Metamask Snap for seamless integration with dApps. */
const metamaskSnap: InjectedExtension = {
  accounts: {
    get: getSnapAccounts,
    subscribe: snapSubscriptionManager().subscribe
  },
  metadata: new Metadata(),
  name: DEFAULT_SNAP_NAME,
  // provider?: InjectedProvider,
  signer: {
    signPayload: requestSignJSON,
    signRaw: requestSignRaw,
    // update?: (id: number, status: H256 | ISubmittableResult) => void
  },
  version: DEFAULT_SNAP_VERSION,
}

/** @internal Connects to a specified dApp using the Snap API. */
const connect = async (
  appName: string,
): Promise<InjectedExtension> => {
  console.info(`${DEFAULT_SNAP_NAME} is connecting to ${appName} ...`)

  const response = await connectSnap();

  return {
    ...metamaskSnap,
    version: response?.[DEFAULT_SNAP_ORIGIN]?.version, // overwrites the default version
  }
};

/**
 * @summary Injected Metamask Snap for dApp connection.
 * @description 
 * Provides the necessary functionality to connect the injected Metamask Snap to a dApp. 
 * The version property represents the default version of the injected Metamask Snap.
 */
export const injectedMetamaskSnap: InjectedWindowProvider = {
  connect,
  enable: connect,
  version: DEFAULT_SNAP_VERSION,
}

/**
 * @summary Verifies the presence of PolkaMask Snap on the user's wallet.
 * @description 
 * This function asynchronously checks whether PolkaMask Snap is installed in the user's Metamask extension.
 */
export async function isPolkaMaskInstalled(): Promise<boolean> {
  try {
    return !!await getSnap();
  } catch (e) {
    console.info(e)
    return false;
  }
}
