// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { HeaderType, WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import { useAutoNavigateEarning, useGetYieldPositions, useTranslation } from '@subwallet/extension-koni-ui/hooks';
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

  const { setHeaderType } = useContext(WebUIContext);

  const yieldPositions = useGetYieldPositions();

  useAutoNavigateEarning();

  const onBack = useCallback(() => {
    navigate('/home/earning/detail');
  }, [navigate]);

  useEffect(() => {
    if (yieldPositions.length) {
      setHeaderType(HeaderType.COMMON_BACK);
    } else {
      setHeaderType(HeaderType.COMMON);
    }
  }, [setHeaderType, yieldPositions.length]);

  return (
    <Layout.Base
      className={className}
      onBack={onBack}
      showSubHeader={true}
      subHeaderBackground={'transparent'}
      subHeaderCenter={false}
      subHeaderPaddingVertical={true}
      title={t('Earning pools')}
    >
      <EarningOverviewContent />
    </Layout.Base>
  );
};

const EarningOverview = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({});
});

export default EarningOverview;
