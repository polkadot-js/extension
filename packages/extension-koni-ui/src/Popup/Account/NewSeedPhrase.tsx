// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, LoadingContainer } from '@subwallet/extension-koni-ui/components';
import WordPhrase from '@subwallet/extension-koni-ui/components/WordPhrase';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useAutoNavigateToCreatePassword from '@subwallet/extension-koni-ui/hooks/router/autoNavigateToCreatePassword';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { createAccountSuriV2, createSeedV2 } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { NewSeedPhraseState } from '@subwallet/extension-koni-ui/types/account';
import { Icon } from '@subwallet/react-ui';
import { CheckCircle, Info } from 'phosphor-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

type Props = ThemeProps;

const FooterIcon = (
  <Icon
    customSize={'28px'}
    phosphorIcon={CheckCircle}
    size='sm'
    weight='fill'
  />
);

const Component: React.FC<Props> = ({ className }: Props) => {
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const location = useLocation();
  const notify = useNotification();
  const navigate = useNavigate();
  const [accountTypes] = useState<KeypairType[]>((location.state as NewSeedPhraseState)?.accountTypes || []);

  const accountName = useGetDefaultAccountName();

  const [seedPhrase, setSeedPhrase] = useState('');
  const [loading, setLoading] = useState(false);

  const _onCreate = useCallback((): void => {
    if (!seedPhrase) {
      return;
    }

    setLoading(true);

    setTimeout(() => {
      createAccountSuriV2({
        name: accountName,
        suri: seedPhrase,
        types: accountTypes,
        isAllowed: true
      })
        .then(() => {
          // window.localStorage.setItem('popupNavigation', '/');
          navigate(DEFAULT_ROUTER_PATH);
        })
        .catch((error: Error): void => {
          // setIsBusy(false);
          notify({
            message: error.message,
            type: 'error'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }, 500);
  }, [accountName, seedPhrase, accountTypes, navigate, notify]);

  useEffect((): void => {
    createSeedV2(undefined, undefined, [SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE])
      .then((response): void => {
        const phrase = response.seed;

        setSeedPhrase(phrase);
      })
      .catch(console.error);
  }, []);

  return (
    <Layout.Base
      rightFooterButton={{
        children: t('I have saved it somewhere safe'),
        icon: FooterIcon,
        onClick: _onCreate,
        disabled: !seedPhrase,
        loading: loading
      }}
      showBackButton={true}
      showSubHeader={true}
      subHeaderBackground='transparent'
      subHeaderCenter={true}
      subHeaderIcons={[
        {
          icon: <Icon
            phosphorIcon={Info}
            size='sm'
          />
        }
      ]}
      subHeaderPaddingVertical={true}
      title={t<string>('Your recovery phrase')}
    >
      {seedPhrase && (
        <div className={className}>
          <div className='description'>
            {t('Keep your recovery phrase in a safe place, and never disclose it. Anyone with this phrase can take control of your assets.')}
          </div>
          <WordPhrase seedPhrase={seedPhrase} />
        </div>
      )}
      {!seedPhrase && (<LoadingContainer />)}
    </Layout.Base>
  );
};

const NewSeedPhrase = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    padding: token.padding,
    textAlign: 'center',

    '.description': {
      padding: `0 ${token.padding}px`,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription,
      marginBottom: token.margin
    }
  };
});

export default NewSeedPhrase;
