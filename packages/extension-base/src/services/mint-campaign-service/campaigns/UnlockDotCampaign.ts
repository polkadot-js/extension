// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { UnlockDotCheckMintData, UnlockDotCheckMintRequest, UnlockDotCheckMintResponse, UnlockDotFetchMintedResponse, UnlockDotMintedData, UnlockDotMintSubmitRequest, UnlockDotMintSubmitResponse, UnlockDotSubmitMintData, UnlockDotTransactionNft } from '@subwallet/extension-base/types';
import { fetchJson, isSameAddress } from '@subwallet/extension-base/utils';
import { BehaviorSubject } from 'rxjs';

import { MINT_HOST } from '../constants';

export default class UnlockDotCampaign {
  readonly #host = MINT_HOST;
  readonly #campaignId = 4;
  readonly #state: KoniState;

  readonly #transactionNftSubject: BehaviorSubject<Record<string, UnlockDotTransactionNft>> = new BehaviorSubject<Record<string, UnlockDotTransactionNft>>({});
  readonly #transactionNftState: Record<string, UnlockDotTransactionNft> = {};

  constructor (state: KoniState) {
    this.#state = state;
  }

  public async mintNft ({ address, extrinsicHash, network, slug, transactionId }: UnlockDotSubmitMintData) {
    this.#transactionNftState[transactionId] = undefined;

    this.#transactionNftSubject.next(this.#transactionNftState);

    const requestId = await this.checkMint({ address, extrinsicHash, network, slug });

    let result: UnlockDotMintedData | undefined;

    if (requestId) {
      result = await this.submitNft(address, requestId);

      await this.#state.reloadNft();
    // } else {
    //   result = await this.getMinted(address, slug);
    }

    this.#transactionNftState[transactionId] = result ?? { nftImage: '' };

    this.#transactionNftSubject.next(this.#transactionNftState);
  }

  private async checkMint ({ address, extrinsicHash, network, slug }: UnlockDotCheckMintData): Promise<number | null> {
    const data: UnlockDotCheckMintRequest = {
      address,
      campaignId: this.#campaignId,
      category: slug,
      additionalData: {
        slug,
        extrinsicHash,
        network
      }
    };

    const respData = await fetchJson<UnlockDotCheckMintResponse>(`${this.#host}/api/mint/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (
      respData.inMintingTime &&
      respData.hasBalance &&
      respData.validCampaign &&
      respData.validCategory &&
      respData.validUser &&
      respData.notDuplicated &&
      respData.requestId &&
      respData.requestId > 1
    ) {
      return respData.requestId;
    }

    return null;
  }

  private async submitNft (address: string, id: number) {
    const data: UnlockDotMintSubmitRequest = {
      requestId: id,
      recipient: address
    };

    return await fetchJson<UnlockDotMintSubmitResponse>(`${this.#host}/api/mint/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  // @ts-ignore
  private async getMinted (address: string, slug: string) {
    const params = { address };

    const data = await fetchJson<UnlockDotFetchMintedResponse>(`${this.#host}/api/mint/check`, {
      method: 'GET',
      params: params
    });

    for (const item of data) {
      if (
        isSameAddress(item.address, address) &&
        slug === item.mintCategory &&
        item.status === 'success' &&
        item.campaignId === this.#campaignId
      ) {
        return item;
      }
    }

    return undefined;
  }

  public async canMint (address: string, slug: string, network: string) {
    const data: UnlockDotCheckMintRequest = {
      address,
      campaignId: this.#campaignId,
      category: slug,
      additionalData: {
        slug,
        network
      }
    };

    const respData = await fetchJson<UnlockDotCheckMintResponse>(`${this.#host}/api/mint/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (
      respData.inMintingTime &&
      respData.validCampaign &&
      respData.validCategory &&
      respData.validUser &&
      respData.notDuplicated
    ) {
      return true;
    }

    return false;
  }

  public subscribeMintedNft (transactionId: string, cb: (data: UnlockDotTransactionNft) => void) {
    return this.#transactionNftSubject.subscribe({
      next: (map) => {
        cb(map[transactionId]);
      }
    });
  }

  public getMintedNft (transactionId: string) {
    return this.#transactionNftSubject.value[transactionId];
  }
}
