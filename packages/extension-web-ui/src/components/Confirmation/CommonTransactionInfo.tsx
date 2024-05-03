// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MetaInfo } from '@subwallet/extension-web-ui/components';
import { useGetAccountByAddress, useGetChainPrefixBySlug } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { toShort } from '@subwallet/extension-web-ui/utils';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps{
  address: string;
  network: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { address, className, network } = props;

  const { t } = useTranslation();

  const account = useGetAccountByAddress(address);
  const networkPrefix = useGetChainPrefixBySlug(network);

  return (
    <MetaInfo
      className={CN(className)}
      hasBackgroundWrapper={true}
    >
      <MetaInfo.Account
        address={account?.address || address}
        label={t('Account name')}
        name={account?.name}
        networkPrefix={networkPrefix}
      />
      <MetaInfo.Default
        className={'address-field'}
        label={t('Address')}
      >
        {toShort(address)}
      </MetaInfo.Default>
      <MetaInfo.Chain
        chain={network}
        label={t('Network')}
      />
    </MetaInfo>
  );
};

const CommonTransactionInfo = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.address-field': {
      whiteSpace: 'nowrap'
    }
  };
});

export default CommonTransactionInfo;
