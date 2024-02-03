// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EarningStatus, YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { MetaInfo } from '@subwallet/extension-web-ui/components';
import { StakingStatusUi } from '@subwallet/extension-web-ui/constants';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { MinusCircle, PlusCircle } from 'phosphor-react';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  poolInfo: YieldPoolInfo;
  compound: YieldPositionInfo;
  onLeavePool: VoidFunction;
  onEarnMore: VoidFunction;
};

function Component ({ className, compound, onEarnMore, onLeavePool,
  poolInfo }: Props) {
  const { t } = useTranslation();

  const earningStatus = useMemo(() => {
    const stakingStatusUi = StakingStatusUi;
    const status = compound.status;

    if (status === EarningStatus.EARNING_REWARD) {
      return stakingStatusUi.active;
    }

    if (status === EarningStatus.PARTIALLY_EARNING) {
      return stakingStatusUi.partialEarning;
    }

    if (status === EarningStatus.WAITING) {
      return stakingStatusUi.waiting;
    }

    return stakingStatusUi.inactive;
  }, [compound.status]);

  return (
    <div
      className={CN(className, '__earning-info-desktop-part')}
    >
      <MetaInfo
        labelColorScheme='gray'
        labelFontWeight='regular'
        spaceSize='sm'
      >
        <MetaInfo.Status
          label={t('Earning status')}
          statusIcon={earningStatus.icon}
          statusName={earningStatus.name}
          valueColorSchema={earningStatus.schema}
        />
        <MetaInfo.Chain
          chain={poolInfo.chain}
          label={t('Network')}
          valueColorSchema='gray'
        />
      </MetaInfo>
      <div className='__separator' />
      <div className={'__earning-actions'}>
        <Button
          block={true}
          icon={(
            <Icon
              phosphorIcon={MinusCircle}
              weight='fill'
            />
          )}
          onClick={onLeavePool}
          type={'ghost'}
        >
          {poolInfo.type === YieldPoolType.LENDING ? t('Withdraw') : t('Unstake')}
        </Button>

        <Button
          block={true}
          icon={(
            <Icon
              phosphorIcon={PlusCircle}
              weight='fill'
            />
          )}
          onClick={onEarnMore}
          type={'ghost'}
        >
          {poolInfo.type === YieldPoolType.LENDING ? t('Supply more') : t('Stake more')}
        </Button>
      </div>
    </div>
  );
}

export const EarningInfoDesktopPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  borderRadius: token.borderRadiusLG,
  backgroundColor: token.colorBgSecondary,
  paddingTop: token.padding,
  paddingLeft: 24,
  paddingRight: 24,
  flex: 1,

  '&.__earning-info-desktop-part': {
    marginBottom: 38
  },

  '.__separator': {
    height: 2,
    backgroundColor: 'rgba(33, 33, 33, 0.80)',
    marginTop: token.marginSM,
    marginBottom: token.marginSM
  },

  '.__label.__label': {
    color: token.colorWhite
  },

  '.__earning-actions': {
    display: 'flex',
    gap: token.sizeSM
  }
}));
