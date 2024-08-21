// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { calculateReward } from '@subwallet/extension-base/services/earning-service/utils';
import { NormalYieldPoolStatistic, YieldCompoundingPeriod, YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';
import { CollapsiblePanel, MetaInfo } from '@subwallet/extension-web-ui/components';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { getUnstakingPeriod } from '@subwallet/extension-web-ui/Popup/Transaction/helper';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  inputAsset: _ChainAsset;
  poolInfo: YieldPoolInfo;
};

function Component ({ className, inputAsset, poolInfo }: Props) {
  const { t } = useTranslation();

  const totalApy = useMemo((): number | undefined => {
    return (
      poolInfo.statistic?.totalApy ||
      (poolInfo.statistic?.totalApr
        ? calculateReward(poolInfo.statistic.totalApr, undefined, YieldCompoundingPeriod.YEARLY).apy
        : undefined)
    );
  }, [poolInfo.statistic?.totalApr, poolInfo.statistic?.totalApy]);

  const unstakePeriod = useMemo((): number | undefined => {
    if (poolInfo.statistic && 'unstakingPeriod' in poolInfo.statistic) {
      return (poolInfo.statistic as NormalYieldPoolStatistic).unstakingPeriod;
    } else {
      return undefined;
    }
  }, [poolInfo.statistic]);

  return (
    <CollapsiblePanel
      className={CN(className)}
      title={t('Earning info')}
    >
      <MetaInfo
        labelColorScheme='gray'
        labelFontWeight='regular'
        spaceSize='sm'
        valueColorScheme='light'
      >
        <MetaInfo.Chain
          chain={poolInfo.chain}
          label={t('Network')}
          valueColorSchema='gray'
        />
        {totalApy !== undefined && (
          <MetaInfo.Number
            label={t('Estimated earnings')}
            suffix={'% ' + t('per year')}
            value={totalApy}
            valueColorSchema='even-odd'
          />
        )}

        <MetaInfo.Number
          decimals={inputAsset?.decimals || 0}
          label={t('Minimum staked')}
          suffix={inputAsset?.symbol}
          value={poolInfo.statistic?.earningThreshold.join || '0'}
          valueColorSchema='even-odd'
        />
        {unstakePeriod !== undefined && (
          <MetaInfo.Default label={t('Unstaking period')}>
            {poolInfo.type === YieldPoolType.LIQUID_STAKING && <span className={'__label'}>Up to</span>}
            {getUnstakingPeriod(t, unstakePeriod)}
          </MetaInfo.Default>
        )}
      </MetaInfo>
    </CollapsiblePanel>
  );
}

export const EarningInfoPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  '.__label': {
    paddingRight: token.paddingXXS
  }

}));
