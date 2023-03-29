// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import CloseIcon from '@subwallet/extension-koni-ui/components/Icon/CloseIcon';
import WordPhrase from '@subwallet/extension-koni-ui/components/WordPhrase';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import { NEW_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import useCompleteCreateAccount from '@subwallet/extension-koni-ui/hooks/account/useCompleteCreateAccount';
import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useAutoNavigateToCreatePassword from '@subwallet/extension-koni-ui/hooks/router/autoNavigateToCreatePassword';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { createAccountSuriV2, createSeedV2 } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { NewSeedPhraseState } from '@subwallet/extension-koni-ui/types/account';
import { isNoAccount } from '@subwallet/extension-koni-ui/util/account/account';
import { Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

type Props = ThemeProps;

const FooterIcon = (
  <Icon
    phosphorIcon={CheckCircle}
    weight='fill'
  />
);

const Component: React.FC<Props> = ({ className }: Props) => {
  useAutoNavigateToCreatePassword();
  const { t } = useTranslation();
  const location = useLocation();
  const notify = useNotification();
  const navigate = useNavigate();

  const { goHome } = useDefaultNavigate();
  const { activeModal } = useContext(ModalContext);

  const onComplete = useCompleteCreateAccount();
  const accountName = useGetDefaultAccountName();

  const { accounts } = useSelector((state: RootState) => state.accountState);
  const [accountTypes] = useState<KeypairType[]>((location.state as NewSeedPhraseState)?.accountTypes || []);

  const [seedPhrase, setSeedPhrase] = useState('');
  const [loading, setLoading] = useState(false);

  const noAccount = useMemo(() => isNoAccount(accounts), [accounts]);

  const onBack = useCallback(() => {
    navigate(DEFAULT_ROUTER_PATH);

    if (!noAccount) {
      activeModal(NEW_ACCOUNT_MODAL);
    }
  }, [navigate, activeModal, noAccount]);

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
  }, [seedPhrase, accountName, accountTypes, onComplete, notify]);

  useEffect(() => {
    createSeedV2(undefined, undefined, [SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE])
      .then((response): void => {
        const phrase = response.seed;

        setSeedPhrase(phrase);
      })
      .catch((e: Error) => {
        console.error(e);
      });
  }, []);

  return (
    <PageWrapper
      className={CN(className)}
      resolve={new Promise((resolve) => !!seedPhrase && resolve(true))}
    >
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={{
          children: t('I have saved it somewhere safe'),
          icon: FooterIcon,
          onClick: _onCreate,
          disabled: !seedPhrase,
          loading: loading
        }}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
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
