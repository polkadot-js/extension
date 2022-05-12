// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import type { DeriveBalancesAll } from '@polkadot/api-derive/types';
import type { RuntimeDispatchInfo } from '@polkadot/types/interfaces';

import Warning from '@subwallet/extension-koni-ui/components/Warning';
import { useCall } from '@subwallet/extension-koni-ui/Popup/Sending/old/hook/useCall';
import { useIsMountedRef } from '@subwallet/extension-koni-ui/Popup/Sending/old/hook/useIsMountedRef';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { ApiPromise } from '@polkadot/api';
import { BN, formatBalance, isFunction } from '@polkadot/util';

interface Props extends ThemeProps {
  accountId: string | null;
  className?: string;
  extrinsic?: SubmittableExtrinsic | null;
  isSendable: boolean;
  onChange?: (hasAvailable: boolean) => void;
  tip?: BN;
  api: ApiPromise;
  apiUrl: string;
  isBusy?: boolean;
}

function PaymentInfo ({ accountId, api, apiUrl, className = '', extrinsic, isBusy }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const [dispatchInfo, setDispatchInfo] = useState<RuntimeDispatchInfo | null>(null);
  const balances = useCall<DeriveBalancesAll>(api.derive.balances?.all, [accountId], undefined, apiUrl);
  const mountedRef = useIsMountedRef();

  useEffect((): void => {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    accountId && extrinsic && isFunction(extrinsic.paymentInfo) && isFunction(api.rpc.payment?.queryInfo) &&
      setTimeout((): void => {
        try {
          extrinsic
            .paymentInfo(accountId)
            .then((info) => mountedRef.current && setDispatchInfo(info))
            .catch(console.error);
        } catch (error) {
          console.error(error);
        }
      }, 0);
  }, [api, accountId, extrinsic, mountedRef]);

  if (!dispatchInfo || !extrinsic) {
    return null;
  }

  const isFeeError = api.consts.balances && !api.tx.balances?.transfer.is(extrinsic) && balances?.accountId.eq(accountId) && (
    balances.availableBalance.lte(dispatchInfo.partialFee) ||
    balances.freeBalance.sub(dispatchInfo.partialFee).lte(api.consts.balances.existentialDeposit as unknown as BN)
  );

  return (
    <div className={className}>
      <div className={'kn-l-fee-info'}>
        <Trans i18nKey='feesForSubmission'>
          Fees of <span className='highlight'>{formatBalance(dispatchInfo.partialFee, { withSiFull: true })}</span> will be applied to the submission
        </Trans>
      </div>
      {!isBusy && isFeeError && (
        <Warning className='kn-l-warning'>
          {t<string>('The account does not have enough free funds (excluding locked/bonded/reserved) available to cover the transaction fees without dropping the balance below the account existential amount.')}
        </Warning>
      )}
    </div>
  );
}

export default React.memo(styled(PaymentInfo)(({ theme }: ThemeProps) => `
  .kn-l-fee-info {
    font-size: 16px;
    font-weight: 500;
    color: ${theme.textColor};
  }

  .kn-l-warning {
    margin-top: 10px;
  }
`));
