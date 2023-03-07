// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InfoItem, MetaInfoBlock, StatusInfoItem } from '@subwallet/extension-koni-ui/components/MetaInfoBlock';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
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
  symbol: string,
  earningEstimated: SwNumberProps['value'],
  commission: SwNumberProps['value']
};

export const ValidatorDetailModalId = 'validatorDetailModalId';

function Component ({ className,
  commission, earningEstimated,
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
      schema: 'success',
      icon: CheckCircle,
      name: t('Success')
    },
    in_active: {
      schema: 'gray',
      icon: StopCircle,
      name: t('Inactive')
    },
    oversubscribed: {
      schema: 'danger',
      icon: ProhibitInset,
      name: t('Oversubscribed')
    }
  }), [t]);

  const infoItems = useMemo<InfoItem[]>(() => {
    return [
      {
        type: 'account',
        key: 'validator',
        label: t('Validator'),
        address: validatorAddress,
        name: validatorName
      },
      {
        type: 'status',
        key: 'status',
        label: t('Status'),
        valueColorSchema: statusMap[status].schema,
        statusName: statusMap[status].name,
        statusIcon: statusMap[status].icon
      } as StatusInfoItem,
      {
        type: 'number',
        key: 'min_stake',
        label: t('Min stake'),
        valueColorSchema: 'even-odd',
        value: minStake,
        suffix: symbol
      },
      {
        type: 'number',
        key: 'own_stake',
        label: t('Own stake'),
        valueColorSchema: 'even-odd',
        value: ownStake,
        suffix: symbol
      },
      {
        type: 'number',
        key: 'earning_estimated',
        label: t('Earning estimated'),
        valueColorSchema: 'even-odd',
        value: earningEstimated,
        suffix: '%'
      },
      {
        type: 'number',
        key: 'commission',
        label: t('Commission'),
        valueColorSchema: 'even-odd',
        value: commission,
        suffix: '%'
      }
    ];
  }, [commission, earningEstimated, minStake, ownStake, status, statusMap, symbol, t, validatorAddress, validatorName]);

  return (
    <SwModal
      className={className}
      id={ValidatorDetailModalId}
      onCancel={onCancel}
      title={t('Validator details')}
    >
      <MetaInfoBlock
        hasBackgroundWrapper
        infoItems={infoItems}
        spaceSize={'xs'}
        valueColorScheme={'light'}
      />
    </SwModal>
  );
}

export const ValidatorDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({

  });
});
