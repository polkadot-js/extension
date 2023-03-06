// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps } from '@subwallet/react-ui';
import { useForm } from '@subwallet/react-ui/es/form/Form';
import Icon from '@subwallet/react-ui/es/icon';
import { FloppyDiskBack, Info } from 'phosphor-react';
import React, { useCallback, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import Layout from '../../../components/Layout';

type Props = ThemeProps

interface ChainImportForm {
  provider: string,
  blockExplorer: string,
  crowdloanUrl: string
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;
  const location = useLocation();
  const showNotification = useNotification();
  const [form] = useForm<ChainImportForm>();

  const [loading, setLoading] = useState(false);

  const handleClickSubheaderButton = useCallback(() => {
    console.log('click subheader');
  }, []);

  const subHeaderButton: ButtonProps[] = [
    {
      icon: <Icon
        customSize={`${token.fontSizeHeading3}px`}
        phosphorIcon={Info}
        type='phosphor'
        weight={'light'}
      />,
      onClick: handleClickSubheaderButton
    }
  ];

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const isSubmitDisabled = useCallback(() => {
    return true;
  }, []);

  const onSubmit = useCallback(() => {
    console.log('submit');
  }, []);

  return (
    <PageWrapper className={`chain_import ${className}`}>
      <Layout.Base
        onBack={onBack}
        rightFooterButton={{
          block: true,
          disabled: isSubmitDisabled(),
          icon: (
            <Icon
              phosphorIcon={FloppyDiskBack}
              type='phosphor'
              weight={'fill'}
            />
          ),
          loading: loading,
          onClick: onSubmit,
          children: 'Save'
        }}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={true}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>('Chain detail')}
      >

      </Layout.Base>
    </PageWrapper>
  );
}

const ChainImport = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({});
});
