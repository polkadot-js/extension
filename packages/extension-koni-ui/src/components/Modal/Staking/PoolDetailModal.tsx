// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo/MetaInfo';
import { NominationPoolsEarningStatusUi, POOL_DETAIL_MODAL, StakingStatusType, StakingStatusUi } from '@subwallet/extension-koni-ui/constants';
import { NominationPoolDataType, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { BaseModal } from '../BaseModal';

type Props = ThemeProps & {
  decimals: number,
  onCancel: () => void,
  selectedNominationPool?: NominationPoolDataType
};

const modalId = POOL_DETAIL_MODAL;

function Component ({ className, decimals, onCancel, selectedNominationPool }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { address = '', bondedAmount, isProfitable, memberCounter = 0, name, state, symbol } = selectedNominationPool || {};

  const earningStatus: StakingStatusType = useMemo(() => {
    return isProfitable ? 'active' : 'inactive';
  }, [isProfitable]);

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

        {
          state && <MetaInfo.Status
            label={t('State')}
            statusIcon={NominationPoolsEarningStatusUi[state].icon} // TODO: update icon
            statusName={state || ''}
            valueColorSchema={NominationPoolsEarningStatusUi[state].schema}
          />
        }

        <MetaInfo.Status
          label={t('Earning status')}
          statusIcon={StakingStatusUi[earningStatus].icon} // TODO: update icon
          statusName={StakingStatusUi[earningStatus].name}
          valueColorSchema={StakingStatusUi[earningStatus].schema}
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
