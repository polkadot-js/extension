// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, InstructionContainer, InstructionContentType, Layout, PageWrapper, WordPhrase } from '@subwallet/extension-web-ui/components';
import { SeedPhraseTermModal } from '@subwallet/extension-web-ui/components/Modal/TermsAndConditions/SeedPhraseTermModal';
import { CONFIRM_TERM_SEED_PHRASE, DEFAULT_ACCOUNT_TYPES, DEFAULT_ROUTER_PATH, NEW_SEED_MODAL, SEED_PREVENT_MODAL, SELECTED_ACCOUNT_TYPE, TERM_AND_CONDITION_SEED_PHRASE_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useAutoNavigateToCreatePassword, useCompleteCreateAccount, useDefaultNavigate, useGetDefaultAccountName, useIsPopup, useNotification, useTranslation, useUnlockChecker } from '@subwallet/extension-web-ui/hooks';
import { createAccountSuriV2, createSeedV2, windowOpen } from '@subwallet/extension-web-ui/messaging';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { isFirefox } from '@subwallet/extension-web-ui/utils';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { saveAs } from 'file-saver';
import { CheckCircle, Download } from 'phosphor-react';
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
  const { activeModal } = useContext(ModalContext);
  const checkUnlock = useUnlockChecker();
  const { isWebUI } = useContext(ScreenContext);

  const onComplete = useCompleteCreateAccount();
  const accountName = useGetDefaultAccountName();
  const isPopup = useIsPopup();

  const { hasMasterPassword, isNoAccount } = useSelector((state: RootState) => state.accountState);

  const isOpenWindowRef = useRef(false);

  const [typesStorage] = useLocalStorage(SELECTED_ACCOUNT_TYPE, DEFAULT_ACCOUNT_TYPES);
  const [preventModalStorage] = useLocalStorage(SEED_PREVENT_MODAL, false);
  const [preventModal] = useState(preventModalStorage);

  const [accountTypes] = useState(typesStorage);

  const [seedPhrase, setSeedPhrase] = useState('');
  const [loading, setLoading] = useState(false);

  const onBack = useCallback(() => {
    navigate(DEFAULT_ROUTER_PATH);

    if (!preventModal) {
      if (!isNoAccount) {
        activeModal(NEW_SEED_MODAL);
      }
    }
  }, [navigate, preventModal, isNoAccount, activeModal]);

  const onClickToSave = useCallback(() => {
    const blob = new Blob([seedPhrase], { type: 'text/plain' });

    saveAs(blob, 'mnemonic-seed.txt');
  }, [seedPhrase]);

  const instructionContent: InstructionContentType[] = useMemo(() => {
    return [
      {
        title: 'What is a seed phrase?',
        description: 'Seed phrase is a 12- or 24-word phrase that can be used to restore your wallet. The recovery phrase alone can give anyone full access to your wallet and the funds.',
        type: 'warning'
      },
      {
        title: 'What if I lose the seed phrase?',
        description:
          <div>
            {t('There is no way to get back your seed phrase if you lose it. Make sure you store them at someplace safe which is accessible only to you. ')}
            <u
              className={'__instruction-content-download'}
              onClick={onClickToSave}
              style={{ textDecoration: 'underline' }}
            >{t('Download seed phrase ')}
              <Icon
                phosphorIcon={Download}
                size='sm'
                type='phosphor'
                weight='fill'
              />
            </u>
          </div>,
        type: 'warning'
      }
    ];
  }, [onClickToSave, t]);

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
  }, [_isConfirmedTermSeedPhrase, activeModal]);

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

  const buttonProps = {
    children: t('I have saved it somewhere safe'),
    icon: FooterIcon,
    onClick: onConfirmTerms,
    disabled: !seedPhrase,
    loading: loading
  };

  useEffect(() => {
    if (isPopup && isFirefox && hasMasterPassword && !isOpenWindowRef.current) {
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
        {...(!isWebUI
          ? {
            rightFooterButton: buttonProps,
            showBackButton: true,
            subHeaderPaddingVertical: true,
            showSubHeader: true,
            subHeaderCenter: true,
            subHeaderBackground: 'transparent'
          }
          : {})}
        subHeaderIcons={[
          !isWebUI
            ? {
              icon: <CloseIcon />,
              onClick: goHome
            }
            : {}
        ]}
        title={t('Your seed phrase')}
      >
        <div className={CN('container', {
          '__web-ui': isWebUI
        })}
        >
          <div className={'seed-phrase-container'}>
            <div className='description'>
              {t('Keep your seed phrase in a safe place, and never disclose it. Anyone with this phrase can take control of your assets.')}
            </div>
            <WordPhrase
              enableDownload={true}
              seedPhrase={seedPhrase}
            />

            {isWebUI && (
              <Button
                {...buttonProps}
                className='action'
              />
            )}
          </div>

          {isWebUI && (
            <InstructionContainer contents={instructionContent} />
          )}
        </div>

      </Layout.WithSubHeaderOnly>
      <SeedPhraseTermModal onOk={_onCreate} />
    </PageWrapper>
  );
};

const NewSeedPhrase = styled(Component)<Props>(({ theme: { extendToken, token } }: Props) => {
  return {
    '.container': {
      padding: `0 ${token.padding}px`,
      textAlign: 'center',
      width: extendToken.twoColumnWidth,
      maxWidth: '100%',
      margin: '0 auto',

      '.seed-phrase-container': {
        padding: token.padding,
        textAlign: 'center',
        flex: 1

      },

      '&.__web-ui': {
        display: 'flex',
        justifyContent: 'center',
        maxWidth: '60%',
        margin: '0 auto',
        gap: token.paddingMD,

        '.action': {
          marginTop: 40,
          width: '100%'
        },

        '.instruction-container': {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }
      }
    },

    '.description': {
      padding: `0 ${token.padding}px`,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription,
      marginBottom: token.margin
    },

    '.__instruction-content-download': {
      cursor: 'pointer',
      display: 'inline-flex',
      gap: token.paddingSM - 6
    }
  };
});

export default NewSeedPhrase;
