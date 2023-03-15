// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AmountData } from '@subwallet/extension-base/background/KoniTypes';
import InfoIcon from '@subwallet/extension-koni-ui/components/Icon/InfoIcon';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Number, SwModal, SwNumberProps } from '@subwallet/react-ui';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel: () => void,
  activeNominators: [SwNumberProps['value'], SwNumberProps['value']],
  estimatedEarning: SwNumberProps['value'],
  minimumActive: AmountData,
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

  return (
    <SwModal
      className={className}
      id={StakingNetworkDetailModalId}
      onCancel={onCancel}
      rightIconProps={{
        icon: <InfoIcon />
      }}
      title={t('Network details')}
    >
      <MetaInfo
        hasBackgroundWrapper
        spaceSize={'xs'}
        valueColorScheme={'light'}
      >
        <MetaInfo.Default label={t('Active nominators')}>
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
        </MetaInfo.Default>

        <MetaInfo.Number
          label={t('Estimated earning')}
          suffix={'%'}
          value={estimatedEarning}
          valueColorSchema={'even-odd'}
        />

        <MetaInfo.Number
          decimals={minimumActive.decimals}
          label={t('Minimum active')}
          suffix={minimumActive.symbol}
          value={minimumActive.value}
          valueColorSchema={'even-odd'}
        />

        <MetaInfo.Default label={t('Active nominators')}>
          {unstakingPeriod}
        </MetaInfo.Default>
      </MetaInfo>
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
