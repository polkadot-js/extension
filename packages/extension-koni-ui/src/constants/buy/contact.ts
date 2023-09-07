// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BuyServiceInfo, SupportService } from '@subwallet/extension-koni-ui/types';

export const BUY_SERVICE_CONTACTS: Record<SupportService, BuyServiceInfo> = {
  transak: {
    contactUrl: 'https://support.transak.com/',
    name: 'Transak',
    policyUrl: 'https://transak.com/privacy-policy',
    url: 'https://transak.com/',
    termUrl: 'https://transak.com/terms-of-service'
  },
  banxa: {
    contactUrl: 'http://support.banxa.com/',
    name: 'Banxa',
    policyUrl: 'https://banxa.com/wp-content/uploads/2023/06/Privacy-and-Cookies-Policy-19-June-2023.pdf',
    url: 'https://banxa.com/',
    termUrl: 'https://banxa.com/wp-content/uploads/2023/06/Customer-Terms-and-Conditions-19-June-2023.pdf'
  },
  // TODO: Change text and url
  coinbase: {
    contactUrl: 'https://help.coinbase.com/en/contact-us',
    name: 'Coinbase',
    policyUrl: 'https://coinbase.com/legal/privacy',
    url: 'https://coinbase.com/',
    termUrl: 'https://coinbase.com/legal/user_agreement/united_states'
  },
  moonpay: {
    contactUrl: 'https://support.moonpay.com/',
    name: 'MoonPay',
    policyUrl: '',
    url: '',
    termUrl: ''
  },
  onramper: {
    contactUrl: '',
    name: '',
    policyUrl: '',
    url: '',
    termUrl: ''
  }
};
