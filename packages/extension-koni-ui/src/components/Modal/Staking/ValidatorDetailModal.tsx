// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { StakingStatus, StakingStatusType } from '@subwallet/extension-koni-ui/util/stakingStatus';
import { SwModal, SwNumberProps } from '@subwallet/react-ui';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel: () => void,
  validatorAddress: string,
  validatorName: string,
  status: StakingStatusType,
  minStake: SwNumberProps['value'],
  ownStake: SwNumberProps['value'],
  decimals: number,
  symbol: string,
  earningEstimated: SwNumberProps['value'],
  commission: SwNumberProps['value']
};

export const ValidatorDetailModalId = 'validatorDetailModalId';

function Component ({ className,
  commission, decimals,
  earningEstimated,
  minStake,
  onCancel,
  ownStake,
  status,
  symbol,
  validatorAddress,
  validatorName }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <SwModal
      className={className}
      id={ValidatorDetailModalId}
      onCancel={onCancel}
      title={t('Validator details')}
    >
      <MetaInfo
        hasBackgroundWrapper
        spaceSize={'xs'}
        valueColorScheme={'light'}
      >
        <MetaInfo.Account
          address={validatorAddress}
          label={t('Validator')}
          name={validatorName}
        />

        <MetaInfo.Status
          label={t('Status')}
          statusIcon={StakingStatus[status].icon}
          statusName={StakingStatus[status].name}
          valueColorSchema={StakingStatus[status].schema}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Min stake')}
          suffix={symbol}
          value={minStake}
          valueColorSchema={'even-odd'}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Own stake')}
          suffix={symbol}
          value={ownStake}
          valueColorSchema={'even-odd'}
        />

        <MetaInfo.Number
          label={t('Earning estimated')}
          suffix={'%'}
          value={earningEstimated}
          valueColorSchema={'even-odd'}
        />

        <MetaInfo.Number
          label={t('Commission')}
          suffix={'%'}
          value={commission}
          valueColorSchema={'even-odd'}
        />
      </MetaInfo>
    </SwModal>
  );
}

export const ValidatorDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({

  });
});
