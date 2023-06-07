// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Banxa from '@banxa-global/js-sdk';
import { BuyOrderTransaction } from '@banxa-global/js-sdk/dist/domains/orders/builders/buyOrderTransaction';
import { BANXA_SANBOX_API_SECRET, BANXA_SANDBOX_API_KEY, BANXA_SUBDOMAIN, BANXA_TEST_MODE } from '@subwallet/extension-koni-ui/constants';
import { CreateBuyOrderFunction } from '@subwallet/extension-koni-ui/types';

const banxa = Banxa.create(BANXA_SUBDOMAIN, BANXA_SANDBOX_API_KEY, BANXA_SANBOX_API_SECRET, BANXA_TEST_MODE);

interface OrderResponse {
  id: string,
  account_id: string,
  account_reference: string,
  order_type: string,
  fiat_code: string,
  fiat_amount: number,
  coin_code: string,
  wallet_address: string,
  blockchain: {
    id: number,
    code: string,
    description: string
  },
  created_at: string,
  checkout_url: string
}

type CreateBanxaOrderResponse = OrderResponse[];

export const createBanxaOrder: CreateBuyOrderFunction = (token, address, network, walletReference) => {
  return new Promise<string>((resolve, reject) => {
    (banxa.createBuyOrder(BuyOrderTransaction.createFromFiatAmount(walletReference, 'USD', token, 100, address, undefined, network), false, 'https://www.subwallet.app/') as Promise<CreateBanxaOrderResponse>)
      .then((res) => {
        const order = res[0];

        resolve(order.checkout_url);
      })
      .catch((e) => {
        reject(e);
      });
  });
};
