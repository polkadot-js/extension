// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AmountData, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import InfoIcon from '@subwallet/extension-koni-ui/components/Icon/InfoIcon';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo/MetaInfo';
import { BaseModal } from '@subwallet/extension-koni-ui/components/Modal/BaseModal';
import { STAKING_NETWORK_DETAIL_MODAL } from '@subwallet/extension-koni-ui/constants';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { getUnstakingPeriod } from '@subwallet/extension-koni-ui/Popup/Transaction/helper/staking/stakingHandler';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext, Number, SwNumberProps } from '@subwallet/react-ui';
import { BigNumber } from 'bignumber.js';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  activeNominators?: SwNumberProps['value'];
  estimatedEarning?: SwNumberProps['value'];
  inflation?: SwNumberProps['value'];
  minimumActive: AmountData;
  unstakingPeriod?: number;
  maxValidatorPerNominator: SwNumberProps['value'];
  stakingType: StakingType;
};

const modalId = STAKING_NETWORK_DETAIL_MODAL;

function Component ({ activeNominators,
  className,
  estimatedEarning,
  inflation,
  maxValidatorPerNominator,
  minimumActive,
  stakingType,
  unstakingPeriod }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  return (
    <BaseModal
      className={className}
      id={modalId}
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
        {
          stakingType === StakingType.NOMINATED && (
            <>
              <MetaInfo.Number
                label={t('Max nomination')}
                value={maxValidatorPerNominator}
                valueColorSchema={'even-odd'}
              />

              {
                !!activeNominators &&
                (
                  <MetaInfo.Default label={t('Total nominators')}>
                    <div className={'__active-nominators-value'}>
                      <Number
                        className={'__current-nominator-count'}
                        decimal={0}
                        decimalOpacity={1}
                        intOpacity={1}
                        unitOpacity={1}
                        value={activeNominators}
                      />
                    </div>
                  </MetaInfo.Default>
                )
              }
            </>
          )
        }

        {!!estimatedEarning && !!inflation &&
          <MetaInfo.Default
            label={t('Estimated earnings')}
            labelAlign={'top'}
          >
            <div className={'__active-nominators-value'}>
              <Number
                className={'__current-nominator-count'}
                decimal={0}
                decimalOpacity={1}
                intOpacity={1}
                suffix={'%'}
                unitOpacity={1}
                value={estimatedEarning}
              />
              <span className={'__slash'}>/</span>
              <Number
                className={'__total-nominator-count'}
                decimal={0}
                decimalOpacity={1}
                intOpacity={1}
                suffix={'%'}
                unitOpacity={1}
                value={new BigNumber(estimatedEarning).minus(inflation)}
              />
              <span className={'__inflation'}>{t('after inflation')}</span>
            </div>
          </MetaInfo.Default>
        }

        <MetaInfo.Number
          decimals={minimumActive.decimals}
          label={t('Minimum active')}
          suffix={minimumActive.symbol}
          value={minimumActive.value}
          valueColorSchema={'success'}
        />

        {!!unstakingPeriod && <MetaInfo.Default label={t('Unstaking period')}>
          <span>{getUnstakingPeriod(t, unstakingPeriod)}</span>
        </MetaInfo.Default>}
      </MetaInfo>
    </BaseModal>
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

    '.__inflation': {
      marginLeft: token.marginXXS,
      color: token.colorTextLight4
    },

    '.__current-nominator-count, .__total-nominator-count': {
      display: 'inline-flex'
    },

    '.__total-nominator-count': {
      color: token.colorTextLight4
    },

    '.-to-right': {
      textAlign: 'right'
    }
  });
});
