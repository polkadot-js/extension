// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import CloseIcon from '@subwallet/extension-koni-ui/components/Icon/CloseIcon';
import WordPhrase from '@subwallet/extension-koni-ui/components/WordPhrase';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import { NEW_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import useCompleteCreateAccount from '@subwallet/extension-koni-ui/hooks/account/useCompleteCreateAccount';
import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useAutoNavigateToCreatePassword from '@subwallet/extension-koni-ui/hooks/router/useAutoNavigateToCreatePassword';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { createAccountSuriV2, createSeedV2 } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { NewSeedPhraseState } from '@subwallet/extension-koni-ui/types/account';
import { isNoAccount } from '@subwallet/extension-koni-ui/utils/account/account';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

import InstructionContainer, { InstructionContentType } from '../../components/InstructionContainer';

type Props = ThemeProps;

const FooterIcon = (
  <Icon
    phosphorIcon={CheckCircle}
    weight='fill'
  />
);

const instructionContent: InstructionContentType[] = [
  {
    title: 'What is a recovery phrase?',
    description: 'Recovery phrase is a 12- or 24-word phrase that can be used to restore your wallet. The recovery phrase alone can give anyone full access to your wallet and the funds.',
    type: 'warning'
  },
  {
    title: 'What if I lose the recovery phrase?',
    description: 'There is no way to get back your recovery phrase if you lose it. Make sure you store them at someplace safe which is accessible only to you.',
    type: 'warning'
  }
];

const Component: React.FC<Props> = ({ className }: Props) => {
  useAutoNavigateToCreatePassword();
  const { t } = useTranslation();
  const location = useLocation();
  const notify = useNotification();
  const navigate = useNavigate();

  const { goHome } = useDefaultNavigate();
  const { activeModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);

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

  const buttonProps = {
    children: t('I have saved it somewhere safe'),
    icon: FooterIcon,
    onClick: _onCreate,
    disabled: !seedPhrase,
    loading: loading
  };

  return (
    <PageWrapper
      className={CN(className)}
      resolve={new Promise((resolve) => !!seedPhrase && resolve(true))}
    >
      <Layout.Base
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
          : {
            headerList: ['Simple'],
            showWebHeader: true
          })}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={t('Your seed phrase')}
      >
        <div className={CN('container', {
          '__web-ui': isWebUI
        })}
        >
          <div className={'seed-phrase-container'}>
            <div className='description'>
              {t('Keep your recovery phrase in a safe place, and never disclose it. Anyone with this phrase can take control of your assets.')}
            </div>
            <WordPhrase seedPhrase={seedPhrase} />

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

      </Layout.Base>
    </PageWrapper>
  );
};

const NewSeedPhrase = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.container': {
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
    }
  };
});

export default NewSeedPhrase;
