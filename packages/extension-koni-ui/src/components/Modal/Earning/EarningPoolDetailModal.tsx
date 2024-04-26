// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EarningStatus } from '@subwallet/extension-base/types';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo/MetaInfo';
import { EarningStatusUi, NominationPoolsEarningStatusUi } from '@subwallet/extension-koni-ui/constants';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { NominationPoolDataType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SwModal } from '@subwallet/react-ui';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel: () => void,
  detailItem?: NominationPoolDataType,
  maxPoolMembersValue?: number
};

export const EarningPoolDetailModalId = 'earningPoolDetailModalId';

function Component ({ className, detailItem, maxPoolMembersValue, onCancel }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { address = '', bondedAmount, decimals, isProfitable, memberCounter = 0, name, state, symbol } = detailItem || {};

  const earningStatus: EarningStatus = useMemo(() => {
    return isProfitable ? EarningStatus.EARNING_REWARD : EarningStatus.NOT_EARNING;
  }, [isProfitable]);

  const ratePercent = useMemo(() => {
    const rate = maxPoolMembersValue && (memberCounter / maxPoolMembersValue);

    if (rate) {
      if (rate < 0.9) {
        return 'default';
      } else if (rate >= 0.9 && rate < 1) {
        return 'gold';
      } else {
        return 'danger';
      }
    }

    return undefined;
  }, [maxPoolMembersValue, memberCounter]);

  return (
    <SwModal
      className={className}
      id={EarningPoolDetailModalId}
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
          state && (
            <MetaInfo.Status
              label={t('State')}
              statusIcon={NominationPoolsEarningStatusUi[state].icon} // TODO: update icon
              statusName={state || ''}
              valueColorSchema={NominationPoolsEarningStatusUi[state].schema}
            />
          )
        }

        <MetaInfo.Status
          label={t('Earning status')}
          statusIcon={EarningStatusUi[earningStatus].icon}
          statusName={EarningStatusUi[earningStatus].name}
          valueColorSchema={EarningStatusUi[earningStatus].schema}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Total staked')}
          suffix={symbol}
          value={bondedAmount || '0'}
          valueColorSchema={'even-odd'}
        />

        {!maxPoolMembersValue &&
            <MetaInfo.Number
            label={t('Total members')}
            value={memberCounter}
            valueColorSchema={'even-odd'}
        />}


        {maxPoolMembersValue && ratePercent && <MetaInfo.Default
          label={'Members'}
          labelAlign='top'
          valueColorSchema={`${ratePercent}`}
        >
          {`${memberCounter} / ${maxPoolMembersValue}`}
        </MetaInfo.Default>}
      </MetaInfo>
    </SwModal>
  );
}

const EarningPoolDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
  });
});

export default EarningPoolDetailModal;
