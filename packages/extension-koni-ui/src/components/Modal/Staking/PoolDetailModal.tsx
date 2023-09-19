// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { POOL_DETAIL_MODAL, StakingStatusType, StakingStatusUi } from '@subwallet/extension-koni-ui/constants';
import { NominationPoolDataType, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

import { MetaInfo } from '../../MetaInfo';
import { BaseModal } from '../BaseModal';

type Props = ThemeProps & {
  decimals: number,
  onCancel: () => void,
  status: StakingStatusType,
  selectedNominationPool?: NominationPoolDataType
};

const modalId = POOL_DETAIL_MODAL;

function Component ({ className, decimals, onCancel, selectedNominationPool, status }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { address = '', bondedAmount, memberCounter = 0, name, state, symbol } = selectedNominationPool || {};

  return (
    <BaseModal
      className={className}
      id={modalId}
      onCancel={onCancel}
      title={t('Pool details')}
    >
      <MetaInfo
        hasBackgroundWrapper
        spaceSize={'xs'}
        valueColorScheme={'light'}
      >
        <MetaInfo.Account
          address={address}
          label={t('Pool')}
          name={name}
        />

        <MetaInfo.Status
          label={t('Status')}
          statusIcon={StakingStatusUi[status].icon} // TODO: update icon
          statusName={state || ''}
          valueColorSchema={StakingStatusUi[status].schema}
        />

        {/* <MetaInfo.Number */}
        {/*  label={t('Commission')} */}
        {/*  suffix={'%'} */}
        {/*  value={'10'} */}
        {/*  valueColorSchema={'even-odd'} */}
        {/* /> */}

        {/* <MetaInfo.Number */}
        {/*  decimals={decimals} */}
        {/*  label={t('Owner pooled')} */}
        {/*  suffix={symbol} */}
        {/*  value={memberCounter} */}
        {/*  valueColorSchema={'even-odd'} */}
        {/* /> */}

        <MetaInfo.Number
          decimals={decimals}
          label={t('Total bonded')}
          suffix={symbol}
          value={bondedAmount || '0'}
          valueColorSchema={'even-odd'}
        />

        <MetaInfo.Number
          label={t('Total members')}
          value={memberCounter}
          valueColorSchema={'even-odd'}
        />
      </MetaInfo>
    </BaseModal>
  );
}

export const PoolDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({

  });
});
