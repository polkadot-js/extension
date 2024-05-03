// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { detectTranslate } from '@subwallet/extension-base/utils';
import AccountItemWithName from '@subwallet/extension-web-ui/components/Account/Item/AccountItemWithName';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  accounts: AccountJson[];
}

const Component: React.FC<Props> = (props: Props) => {
  const { accounts, className } = props;

  const { t } = useTranslation();

  return (
    <div className={CN(className)}>
      <div className='page-icon'>
        <PageIcon
          color='var(--page-icon-color)'
          iconProps={{
            weight: 'fill',
            phosphorIcon: CheckCircle
          }}
        />
      </div>
      <div className='title'>
        {t('All done!')}
      </div>
      <div className='description'>
        {t('You have successfully updated master password to all accounts')}
      </div>
      <div className='account-container'>
        {accounts.slice(0, 2).map((account) => (
          <AccountItemWithName
            accountName={account.name}
            address={account.address}
            avatarSize={24}
            genesisHash={account.genesisHash}
            isSelected={true}
            key={account.address}
          />
        ))}
        {accounts.length > 2 &&
          (
            <div className='and-more'>
              <Trans
                components={{ highlight: <span className='highlight' /> }}
                i18nKey={detectTranslate('And other <highlight>{{number}}</highlight> accounts')}
                values={{ number: String(accounts.length - 2).padStart(2, '0') }}
              />
            </div>
          )
        }
      </div>
    </div>
  );
};

const MigrateDone = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    textAlign: 'center',

    '.page-icon': {
      display: 'flex',
      justifyContent: 'center',
      marginTop: token.margin,
      marginBottom: token.margin,
      '--page-icon-color': token.colorSecondary
    },

    '.title': {
      marginTop: token.margin,
      marginBottom: token.margin,
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      color: token.colorText
    },

    '.description': {
      padding: `0 ${token.controlHeightLG - token.padding}px`,
      marginTop: token.margin,
      marginBottom: token.margin * 2,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextDescription,
      textAlign: 'center'
    },

    '.account-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    },

    '.and-more': {
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextDescription,

      '.highlight': {
        color: token.colorTextBase
      }
    }
  };
});

export default MigrateDone;
