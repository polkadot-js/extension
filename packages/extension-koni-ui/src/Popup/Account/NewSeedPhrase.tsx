// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, Layout, PageWrapper, WordPhrase } from '@subwallet/extension-koni-ui/components';
import { SeedPhraseTermModal } from '@subwallet/extension-koni-ui/components/Modal/TermsAndConditions/SeedPhraseTermModal';
import { CONFIRM_TERM_SEED_PHRASE, DEFAULT_ACCOUNT_TYPES, DEFAULT_ROUTER_PATH, NEW_SEED_MODAL, SEED_PREVENT_MODAL, SELECTED_ACCOUNT_TYPE, TERM_AND_CONDITION_SEED_PHRASE_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useAutoNavigateToCreatePassword, useCompleteCreateAccount, useDefaultNavigate, useGetDefaultAccountName, useIsPopup, useNotification, useTranslation, useUnlockChecker } from '@subwallet/extension-koni-ui/hooks';
import { createAccountSuriV2, createSeedV2, windowOpen } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isFirefox, isNoAccount } from '@subwallet/extension-koni-ui/utils';
import { Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

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
  const notify = useNotification();
  const navigate = useNavigate();
  const [_isConfirmedTermSeedPhrase] = useLocalStorage(CONFIRM_TERM_SEED_PHRASE, 'nonConfirmed');
  const { goHome } = useDefaultNavigate();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const checkUnlock = useUnlockChecker();

  const onComplete = useCompleteCreateAccount();
  const accountName = useGetDefaultAccountName();
  const isPopup = useIsPopup();

  const { accounts, hasMasterPassword } = useSelector((state: RootState) => state.accountState);

  const isOpenWindowRef = useRef(false);

  const [typesStorage] = useLocalStorage(SELECTED_ACCOUNT_TYPE, DEFAULT_ACCOUNT_TYPES);
  const [preventModalStorage] = useLocalStorage(SEED_PREVENT_MODAL, false);
  const [preventModal] = useState(preventModalStorage);

  const [accountTypes] = useState(typesStorage);

  const [seedPhrase, setSeedPhrase] = useState('');
  const [loading, setLoading] = useState(false);

  const noAccount = useMemo(() => isNoAccount(accounts), [accounts]);

  const onBack = useCallback(() => {
    navigate(DEFAULT_ROUTER_PATH);

    if (!preventModal) {
      if (!noAccount) {
        activeModal(NEW_SEED_MODAL);
      }
    }
  }, [preventModal, navigate, noAccount, activeModal]);

  const _onCreate = useCallback((): void => {
    if (!seedPhrase) {
      return;
    }

    checkUnlock().then(() => {
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
    }).catch(() => {
      // User cancel unlock
    });
  }, [seedPhrase, checkUnlock, accountName, accountTypes, onComplete, notify]);

  const onConfirmTerms = useCallback(() => {
    _onCreate();
  }, [_onCreate]);

  useEffect(() => {
    if (_isConfirmedTermSeedPhrase === 'nonConfirmed') {
      activeModal(TERM_AND_CONDITION_SEED_PHRASE_MODAL);
    }
  }, [_isConfirmedTermSeedPhrase, activeModal, inactiveModal]);

  useEffect(() => {
    createSeedV2(undefined, undefined, DEFAULT_ACCOUNT_TYPES)
      .then((response): void => {
        const phrase = response.seed;

        setSeedPhrase(phrase);
      })
      .catch((e: Error) => {
        console.error(e);
      });
  }, []);

  useEffect(() => {
    if (isPopup && isFirefox() && hasMasterPassword && !isOpenWindowRef.current) {
      isOpenWindowRef.current = true;
      windowOpen({ allowedPath: '/accounts/new-seed-phrase' }).then(window.close).catch(console.log);
    }
  }, [isPopup, hasMasterPassword]);

  return (
    <PageWrapper
      className={CN(className)}
      resolve={new Promise((resolve) => !!seedPhrase && resolve(true))}
    >
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={{
          children: t('I have kept it somewhere safe'),
          icon: FooterIcon,
          onClick: onConfirmTerms,
          disabled: !seedPhrase,
          loading: loading
        }}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={t('Your seed phrase')}
      >
        <div className={'container'}>
          <div className='description'>
            {t('Keep your seed phrase in a safe place and never disclose it. Anyone with this phrase can take control of your assets.')}
          </div>
          <WordPhrase
            enableDownload={true}
            seedPhrase={seedPhrase}
          />
        </div>
      </Layout.WithSubHeaderOnly>
      <SeedPhraseTermModal onOk={_onCreate} />
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
