// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CollapsiblePanel, MetaInfo } from '@subwallet/extension-web-ui/components';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps

function Component ({ className }: Props) {
  const { t } = useTranslation();
  const isAllAccount = true;
  const accountInfoItemsNode = useMemo(() => {
    return (
      <MetaInfo
        className={CN('__account-info-item', {
          '-box-mode': isAllAccount
        })}
        hasBackgroundWrapper={isAllAccount}
        labelColorScheme='gray'
        labelFontWeight='regular'
        spaceSize='sm'
        valueColorScheme='light'
      >
        <MetaInfo.Number
          decimals={1}
          label={t('Network fee')}
          suffix={'DOT'}
          value={3}
          valueColorSchema='even-odd'
        />
        <MetaInfo.Number
          decimals={1}
          label={t('Protocol fee')}
          suffix={'DOT'}
          value={100}
          valueColorSchema='even-odd'
        />
        <MetaInfo.Number
          decimals={0}
          label={t('Wallet fee')}
          suffix={'%'}
          value={2}
          valueColorSchema='even-odd'
        />
      </MetaInfo>
    );
  }, [isAllAccount, t]);

  return (
    <>
      <CollapsiblePanel
        className={CN(className, 'transaction-fee-quote', {
          '-horizontal-mode': isAllAccount
        })}
        title={t('Transaction fee')}
      >

        {accountInfoItemsNode}

      </CollapsiblePanel>
    </>
  );
}

export const TransactionFeeQuotes = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  '&.transaction-fee-quote .__panel-header': {
    paddingLeft: 4,
    paddingRight: 0
  },
  '&.transaction-fee-quote .__panel-body': {
    paddingLeft: 0,
    paddingRight: 0
  },
  '.__item-fee-paid .ant-btn': {
    maxHeight: 20,
    maxWidth: 20,
    minWidth: 20,
    paddingLeft: 4
  }
}));
