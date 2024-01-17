// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _FundStatus } from '@subwallet/chain-list/types';
import { capitalize } from '@subwallet/extension-web-ui/utils';

export function getCrowdloanTagColor (fundStatus: _FundStatus) {
  if (fundStatus === _FundStatus.WON) {
    return 'success';
  }

  if (fundStatus === _FundStatus.FAILED || fundStatus === _FundStatus.WITHDRAW) {
    return 'error';
  }

  if (fundStatus === _FundStatus.IN_AUCTION) {
    return 'gold';
  }

  return 'default';
}

export function getCrowdloanTagName (fundStatus: _FundStatus) {
  if (fundStatus === _FundStatus.WON) {
    return 'Won';
  }

  if (fundStatus === _FundStatus.FAILED) {
    return 'Fail';
  }

  if (fundStatus === _FundStatus.WITHDRAW) {
    return 'Withdraw';
  }

  if (fundStatus === _FundStatus.IN_AUCTION) {
    return 'In auction';
  }

  return capitalize((fundStatus as string).replace('_', ' '));
}
