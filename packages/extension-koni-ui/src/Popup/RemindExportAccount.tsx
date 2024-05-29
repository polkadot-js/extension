// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { USER_GUIDE_URL } from '@subwallet/extension-koni-ui/constants';
import { setValueLocalStorage } from '@subwallet/extension-koni-ui/messaging';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, Export, X, XCircle } from 'phosphor-react';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

const SUB_DOMAIN_USER_GUIDE = 'account-management/export-and-backup-accounts#export-all-accounts';
const keyStorage = 'remind_export_account';
const valueStorage = {
  value: 'done',
  key: keyStorage
};

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { token } = useTheme() as Theme;
  const learnMore = useCallback(() => {
    window.open(`${USER_GUIDE_URL}/${SUB_DOMAIN_USER_GUIDE}`);
    setValueLocalStorage(valueStorage)
      .catch(console.error);
  }, []);

  const dismiss = useCallback(() => {
    setValueLocalStorage(valueStorage)
      .catch(console.error);
    window.close();
  }, []);

  useEffect(() => {
    const handleCloseTabs = () => {
      window.localStorage.setItem(keyStorage, 'done');
      window.removeEventListener('beforeunload', handleCloseTabs);
    };

    window.addEventListener('beforeunload', handleCloseTabs);
  }, []);

  const { t } = useTranslation();

  return (
    <Layout.WithSubHeaderOnly
      leftFooterButton={{
        children: t('Dismiss'),
        onClick: dismiss,
        schema: 'secondary',
        icon: <Icon
          phosphorIcon={XCircle}
          weight={'fill'}
        />
      }}
      rightFooterButton={{
        children: t('Learn more'),
        onClick: learnMore,
        icon: <Icon
          phosphorIcon={ArrowCircleRight}
          weight={'fill'}
        />
      }}
      showBackButton={false}
      subHeaderLeft={(
        <Icon
          phosphorIcon={X}
          size='md'
        />
      )}
      title={t('Pay attention')}
    >
      <div className={CN(className)}>
        <div className='page-icon'>
          <PageIcon
            color={token.colorWarning}
            iconProps={{
              weight: 'fill',
              phosphorIcon: Export
            }}
          />
        </div>
        <div className='title'>
          {t('Back up your accounts!')}
        </div>
        <div className='description'>
          {t('If you lose your seed phrases/private keys/JSON backup files/QR backup codes, your accounts can\'t be recovered and your assets are lost. Learn how to back up your accounts to secure your assets now.')}
        </div>
      </div>
    </Layout.WithSubHeaderOnly>
  );
};

const RemindExportAccount = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    textAlign: 'center',

    '.page-icon': {
      display: 'flex',
      justifyContent: 'center',
      marginTop: token.controlHeightLG,
      marginBottom: token.margin,
      '--page-icon-color': token.colorSecondary
    },

    '.title': {
      marginTop: token.margin,
      marginBottom: token.margin,
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      color: token.colorTextBase
    },

    '.description': {
      padding: `0 ${token.controlHeightLG - token.padding}px`,
      marginTop: token.margin,
      marginBottom: token.margin * 2,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextDescription,
      textAlign: 'center'
    }
  };
});

export default RemindExportAccount;
