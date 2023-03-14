// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import WordPhrase from '@subwallet/extension-koni-ui/components/WordPhrase';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import useCompleteCreateAccount from '@subwallet/extension-koni-ui/hooks/account/useCompleteCreateAccount';
import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useAutoNavigateToCreatePassword from '@subwallet/extension-koni-ui/hooks/router/autoNavigateToCreatePassword';
import { createAccountSuriV2, createSeedV2 } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { NewSeedPhraseState } from '@subwallet/extension-koni-ui/types/account';
import { Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, Info } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

type Props = ThemeProps;

const FooterIcon = (
  <Icon
    phosphorIcon={CheckCircle}
    weight='fill'
  />
);

let seedPhrase = '';

const loader = new Promise<string>((resolve, reject) => {
  createSeedV2(undefined, undefined, [SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE])
    .then((response): void => {
      const phrase = response.seed;

      seedPhrase = phrase;
      resolve(phrase);
    })
    .catch((e: Error) => {
      console.error(e);
      reject(e);
    });
});

const Component: React.FC<Props> = ({ className }: Props) => {
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const location = useLocation();
  const notify = useNotification();
  const onComplete = useCompleteCreateAccount();
  const [accountTypes] = useState<KeypairType[]>((location.state as NewSeedPhraseState)?.accountTypes || []);

  const accountName = useGetDefaultAccountName();

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
          onComplete();
        })
        .catch((error: Error): void => {
          notify({
            message: error.message,
            type: 'error'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }, 500);
  }, [accountName, accountTypes, onComplete, notify]);

  return (
    <PageWrapper
      className={CN(className)}
      resolve={loader}
    >
      <Layout.WithSubHeaderOnly
        rightFooterButton={{
          children: t('I have saved it somewhere safe'),
          icon: FooterIcon,
          onClick: _onCreate,
          disabled: !seedPhrase,
          loading: loading
        }}
        subHeaderIcons={[
          {
            icon: (
              <Icon
                phosphorIcon={Info}
                size='md'
              />
            )
          }
        ]}
        title={t<string>('Your recovery phrase')}
      >
        <div className={'container'}>
          <div className='description'>
            {t('Keep your recovery phrase in a safe place, and never disclose it. Anyone with this phrase can take control of your assets.')}
          </div>
          <WordPhrase seedPhrase={seedPhrase} />
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const NewSeedPhrase = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.container': {
      padding: token.padding,
      textAlign: 'center'
    },

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
