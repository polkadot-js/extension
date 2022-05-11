// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';

import { useTranslation } from '@subwallet/extension-koni-ui/components/translate';
import Warning from '@subwallet/extension-koni-ui/components/Warning';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BN, formatBalance } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
}

function PaymentInfo ({ className = '' }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const isFeeError = false;

  return (
    <div className={className}>
      <div className='payment-info__fee-info'>
        <Trans i18nKey='feesForSubmission'>
          Fees of <span className='highlight'>{formatBalance(new BN(0), { withSiFull: true })}</span> will be applied to the submission
        </Trans>
      </div>
      {isFeeError && (
        <Warning className='payment-info__warning'>
          {t<string>('The account does not have enough free funds (excluding locked/bonded/reserved) available to cover the transaction fees without dropping the balance below the account existential amount.')}
        </Warning>
      )}
    </div>
  );
}

export default React.memo(styled(PaymentInfo)(({ theme }: ThemeProps) => `
  .payment-info__fee-info {
    font-size: 16px;
    font-weight: 500;
    color: ${theme.textColor};
  }

  .payment-info__warning {
    margin-top: 10px;
  }
`));
