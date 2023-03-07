// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InfoItem, MetaInfoBlock } from '@subwallet/extension-koni-ui/components/MetaInfoBlock';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, Number, SwModal, SwNumberProps } from '@subwallet/react-ui';
import { Info } from 'phosphor-react';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel: () => void,
  activeNominators: [SwNumberProps['value'], SwNumberProps['value']],
  estimatedEarning: SwNumberProps['value'],
  minimumActive: {
    value: SwNumberProps['value'],
    symbol: string,
  },
  unstakingPeriod: string,
};

export const StakingNetworkDetailModalId = 'stakingNetworkDetailModalId';

function Component ({ className,
  onCancel,
  activeNominators: [currentNominatorCount, totalNominatorCount],
  estimatedEarning,
  minimumActive,
  unstakingPeriod }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const infoItems = useMemo<InfoItem[]>(() => {
    return [
      {
        type: 'default',
        key: 'active_nominators',
        label: t('Active nominators'),
        value: (
          <div className={'__active-nominators-value'}>
            <Number
              className={'__current-nominator-count'}
              decimal={0}
              decimalOpacity={1}
              intOpacity={1}
              unitOpacity={1}
              value={currentNominatorCount}
            />
            <span className={'__slash'}>/</span>
            <Number
              className={'__total-nominator-count'}
              decimal={0}
              decimalOpacity={1}
              intOpacity={1}
              unitOpacity={1}
              value={totalNominatorCount}
            />
          </div>
        )
      },
      {
        type: 'number',
        key: 'estimated_earning',
        label: t('Estimated earning'),
        value: estimatedEarning,
        valueColorSchema: 'even-odd',
        suffix: '%'
      },
      {
        type: 'number',
        key: 'minimum_active',
        label: t('Minimum active'),
        value: minimumActive.value,
        valueColorSchema: 'success',
        suffix: minimumActive.symbol
      },
      {
        type: 'default',
        key: 'unstaking_period',
        label: t('Unstaking period'),
        value: unstakingPeriod
      }
    ];
  }, [currentNominatorCount, estimatedEarning, minimumActive.symbol, minimumActive.value, t, totalNominatorCount, unstakingPeriod]);

  return (
    <SwModal
      className={className}
      id={StakingNetworkDetailModalId}
      onCancel={onCancel}
      rightIconProps={{
        icon: (
          <Icon
            phosphorIcon={Info}
            size='sm'
          />
        )
      }}
      title={t('Network details')}
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

export const StakingNetworkDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.__active-nominators-value': {
    },

    '.__slash': {
      marginLeft: token.marginXXS,
      marginRight: token.marginXXS
    },

    '.__current-nominator-count, .__total-nominator-count': {
      display: 'inline-flex'
    },

    '.__total-nominator-count': {
      color: token.colorTextLight4
    }
  });
});
