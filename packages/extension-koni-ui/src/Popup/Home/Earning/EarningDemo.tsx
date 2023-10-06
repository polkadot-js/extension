// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { EarningOverviewContent } from './parts';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  const { setOnBack } = useContext(WebUIContext);

  const onBack = useCallback(() => {
    navigate('/crowdloan-unlock-campaign/check-contributions');
  }, [navigate]);

  useEffect(() => {
    setOnBack(onBack);

    return () => {
      setOnBack(undefined);
    };
  }, [onBack, setOnBack]);

  return (
    <Layout.Base
      className={className}
      onBack={onBack}
      showSubHeader={true}
      subHeaderBackground={'transparent'}
      subHeaderCenter={true}
      subHeaderPaddingVertical={true}
      title={t('Earning pools')}
    >
      <EarningOverviewContent />
    </Layout.Base>
  );
};

const EarningDemo = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-screen-layout-body': {
      paddingLeft: 165,
      paddingRight: 165
    }
  });
});

export default EarningDemo;
