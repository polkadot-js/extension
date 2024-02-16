// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EarningStatus } from '@subwallet/extension-base/types';
import { BaseModal } from '@subwallet/extension-web-ui/components';
import MetaInfo from '@subwallet/extension-web-ui/components/MetaInfo/MetaInfo';
import { EarningStatusUi, NominationPoolsEarningStatusUi } from '@subwallet/extension-web-ui/constants';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { NominationPoolDataType, ThemeProps } from '@subwallet/extension-web-ui/types';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel: () => void,
  detailItem?: NominationPoolDataType
};

export const EarningPoolDetailModalId = 'earningPoolDetailModalId';

function Component ({ className, detailItem, onCancel }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { address = '', bondedAmount, decimals, isProfitable, memberCounter = 0, name, state, symbol } = detailItem || {};

  const earningStatus: EarningStatus = useMemo(() => {
    return isProfitable ? EarningStatus.EARNING_REWARD : EarningStatus.NOT_EARNING;
  }, [isProfitable]);

  return (
    <BaseModal
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
              statusIcon={NominationPoolsEarningStatusUi[state].icon}
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

        <MetaInfo.Number
          label={t('Total members')}
          value={memberCounter}
          valueColorSchema={'even-odd'}
        />
      </MetaInfo>
    </BaseModal>
  );
}

const EarningPoolDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({

  });
});

export default EarningPoolDetailModal;
