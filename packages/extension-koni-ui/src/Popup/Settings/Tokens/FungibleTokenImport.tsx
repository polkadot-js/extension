// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import PageIcon from '@subwallet/react-ui/es/page-icon';
import { Coin, Info } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import Layout from '../../../components/Layout';

type Props = ThemeProps

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const subHeaderButton: ButtonProps[] = useMemo(() => {
    return [
      {
        icon: <Icon
          phosphorIcon={Info}
          size='sm'
          type='phosphor'
          weight={'light'}
        />,
        onClick: () => {
          navigate('/');
        }
      }
    ];
  }, [navigate]);

  return (
    <PageWrapper
      className={`import_token ${className}`}
      resolve={dataContext.awaitStores(['nft'])}
    >
      <Layout.Base
        onBack={onBack}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={true}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>('Import token')}
      >
        <div className={'import_token__empty_container'}>
          <div className={'import_token__empty_icon_wrapper'}>
            <PageIcon
              color={token.colorSecondary}
              iconProps={{
                phosphorIcon: Coin,
                weight: 'fill'
              }}
            />
          </div>

          <div className={'import_token__empty_text_container'}>
            <div>{t<string>('Import token')}</div>
          </div>
        </div>
      </Layout.Base>
    </PageWrapper>
  );
}

const FungibleTokenImport = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.import_token__container': {
      marginLeft: token.margin,
      marginRight: token.margin
    },

    '.import_token__empty_container': {
      marginTop: 33,
      display: 'flex',
      flexWrap: 'wrap',
      gap: token.padding,
      flexDirection: 'column',
      alignContent: 'center'
    },

    '.import_token__empty_text_container': {
      fontWeight: token.headingFontWeight,
      textAlign: 'center',
      fontSize: token.fontSizeHeading3,
      color: token.colorText
    },

    '.import_token__empty_icon_wrapper': {
      display: 'flex',
      justifyContent: 'center'
    },
  });
});

export default FungibleTokenImport;
