// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import { InfoItemBase } from '@subwallet/extension-koni-ui/components/MetaInfo/parts/types';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SwModal, SwNumberProps } from '@subwallet/react-ui';
import { CheckCircle, ProhibitInset, StopCircle } from 'phosphor-react';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel: () => void,
  validatorAddress: string,
  validatorName: string,
  status: 'active' | 'in_active' | 'oversubscribed',
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

  const statusMap = useMemo(() => ({
    active: {
      schema: 'success' as InfoItemBase['valueColorSchema'],
      icon: CheckCircle,
      name: t('Success')
    },
    in_active: {
      schema: 'gray' as InfoItemBase['valueColorSchema'],
      icon: StopCircle,
      name: t('Inactive')
    },
    oversubscribed: {
      schema: 'danger' as InfoItemBase['valueColorSchema'],
      icon: ProhibitInset,
      name: t('Oversubscribed')
    }
  }), [t]);

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
          statusIcon={statusMap[status].icon}
          statusName={statusMap[status].name}
          valueColorSchema={statusMap[status].schema}
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
