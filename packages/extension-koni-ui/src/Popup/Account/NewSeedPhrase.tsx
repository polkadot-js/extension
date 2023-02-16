// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { createAccountSuriV2, createSeedV2 } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { NewSeedPhraseState } from '@subwallet/extension-koni-ui/types/account';
import { copyToClipboard } from '@subwallet/extension-koni-ui/util/dom';
import { Button, Icon } from '@subwallet/react-ui';
import { CheckCircle, CopySimple, Info } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

interface WordItem {
  index: number;
  label: string;
}

const FooterIcon = (
  <Icon
    customSize={'28px'}
    phosphorIcon={CheckCircle}
    size='sm'
    weight='fill'
  />
);

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const location = useLocation();
  const notify = useNotification();
  const navigate = useNavigate();
  const { accountTypes } = location.state as NewSeedPhraseState;

  const [seedPhrase, setSeedPhrase] = useState('');
  const accountName = useGetDefaultAccountName();

  const words: Array<Array<WordItem>> = useMemo(() => {
    const raw = seedPhrase.split(' ');
    const result: Array<Array<WordItem>> = [];
    let count = 0;
    let temp: Array<WordItem> = [];

    raw.forEach((item, index) => {
      temp.push({ index: index, label: item });
      count++;

      if (count === 3 || index === raw.length - 1) {
        result.push(temp);
        count = 0;
        temp = [];
      }
    });

    return result;
  }, [seedPhrase]);

  const onCopy = useCallback(() => {
    copyToClipboard(seedPhrase);
    notify({
      message: 'Copied'
    });
  }, [seedPhrase, notify]);

  const _onCreate = useCallback((): void => {
    createAccountSuriV2({
      name: accountName,
      suri: seedPhrase,
      types: accountTypes,
      isAllowed: true
    })
      .then((response) => {
        // window.localStorage.setItem('popupNavigation', '/');
        navigate('/home');
      })
      .catch((error: Error): void => {
        // setIsBusy(false);
        console.error(error);
      });
  }, [accountName, seedPhrase, accountTypes, navigate]);

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
      footerButton={{
        children: t('I have saved it somewhere safe'),
        icon: FooterIcon,
        onClick: _onCreate
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
      <div className={className}>
        <div className='description'>
          {t('Keep your recovery phrase in a safe place, and never disclose it. Anyone with this phrase can take control of your assets.')}
        </div>
        <div className='word-container'>
          {words.map((arr, _index) => {
            return (
              <div
                className='word-row'
                key={_index}
              >
                {
                  arr.map((item) => {
                    return (
                      <div
                        className='word-item'
                        key={item.label}
                      >
                        <div className='word-index'>{item.index}</div>
                        <div className='word-content'>{item.label}</div>
                      </div>
                    );
                  })
                }
              </div>
            );
          })}
        </div>
        <Button
          icon={(
            <Icon phosphorIcon={CopySimple} />
          )}
          onClick={onCopy}
          type='ghost'
        >
          {t('Copy to clipboard')}
        </Button>
      </div>
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
      color: token.colorTextDescription
    },

    '.word-container': {
      margin: `${token.margin}px 0`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: token.sizeXS,

      '.word-row': {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: token.sizeXS,

        '.word-item': {
          display: 'flex',
          flexDirection: 'row',
          gap: token.sizeXXS,
          alignItems: 'center',
          padding: `${token.paddingXS}px ${token.padding}px`,
          borderRadius: token.borderRadiusLG,
          backgroundColor: token.colorBgInput,
          fontSize: token.fontSizeHeading6,
          lineHeight: token.lineHeightHeading6,

          '.word-index': {
            color: token.colorTextDescription
          },

          '.word-content': {
            color: token.colorTextBase
          }
        }
      }
    }
  };
});

export default NewSeedPhrase;
