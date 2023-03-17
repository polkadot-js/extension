// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import { InfoItemBase } from '@subwallet/extension-koni-ui/components/MetaInfo/parts/types';
import { NominationPoolDataType } from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetValidatorList';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SwModal } from '@subwallet/react-ui';
import { CheckCircle, ProhibitInset, StopCircle } from 'phosphor-react';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  decimals: number,
  onCancel: () => void,
  selectedNominationPool: NominationPoolDataType
};

export const PoolDetailModalId = 'poolDetailModalId';

function Component ({ className, decimals, onCancel, selectedNominationPool }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { address, identity, memberCount, symbol } = selectedNominationPool;
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
      id={PoolDetailModalId}
      onCancel={onCancel}
      title={t('Pooled details')}
    >
      <MetaInfo
        hasBackgroundWrapper
        spaceSize={'xs'}
        valueColorScheme={'light'}
      >
        <MetaInfo.Account
          address={address}
          label={t('Pool')}
          name={identity}
        />

        <MetaInfo.Status
          label={t('Status')}
          statusIcon={statusMap.active.icon}
          statusName={statusMap.active.name}
          valueColorSchema={statusMap.active.schema}
        />

        <MetaInfo.Number
          label={t('Commission')}
          suffix={'%'}
          value={'10'}
          valueColorSchema={'even-odd'}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Owner pooled')}
          suffix={symbol}
          value={memberCount}
          valueColorSchema={'even-odd'}
        />

        <MetaInfo.Number
          label={t('Total pooled')}
          suffix={'%'}
          value={memberCount}
          valueColorSchema={'even-odd'}
        />

        <MetaInfo.Number
          label={t('Member of pool')}
          suffix={'%'}
          value={memberCount}
          valueColorSchema={'even-odd'}
        />
      </MetaInfo>
    </SwModal>
  );
}

export const PoolDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({

  });
});
