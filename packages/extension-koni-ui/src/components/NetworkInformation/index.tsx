// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { TransactionContext } from '@subwallet/extension-koni-ui/contexts/TransactionContext';
import { useGetChainStakingMetadata, useGetNativeTokenBasicInfo } from '@subwallet/extension-koni-ui/hooks';
import { getUnstakingPeriod } from '@subwallet/extension-koni-ui/Popup/Transaction/helper';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { Info } from 'phosphor-react';
import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';

import { MetaInfo } from '../MetaInfo';

interface Props extends ThemeProps {
  stakingType?: StakingType
}

function Component (props: Props): React.ReactElement<Props> {
  const { className = '', stakingType } = props;
  const { t } = useTranslation();
  const { defaultData: { chain } } = useContext(TransactionContext);
  const { token } = useTheme() as Theme;

  const chainStakingMetadata = useGetChainStakingMetadata(chain);
  const { decimals, symbol } = useGetNativeTokenBasicInfo(chain);

  const minStake = useMemo(() =>
    stakingType === StakingType.POOLED ? chainStakingMetadata?.minJoinNominationPool || '0' : chainStakingMetadata?.minStake || '0'
  , [chainStakingMetadata?.minJoinNominationPool, chainStakingMetadata?.minStake, stakingType]
  );

  const contentBlock = (() => {
    if (!chainStakingMetadata) {
      return null;
    }

    const { expectedReturn: estimatedEarning,
      inflation,
      maxValidatorPerNominator,
      nominatorCount: activeNominators,
      unstakingPeriod } = chainStakingMetadata;

    return (
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
                value={new BigN(estimatedEarning).minus(inflation)}
              />
              <span className={'__inflation'}>{t('after inflation')}</span>
            </div>
          </MetaInfo.Default>
        }

        <MetaInfo.Number
          decimals={decimals}
          label={t('Minimum active')}
          suffix={symbol}
          value={minStake}
          valueColorSchema={'success'}
        />

        {!!unstakingPeriod && <MetaInfo.Default label={t('Unstaking period')}>
          <span>{getUnstakingPeriod(t, unstakingPeriod)}</span>
        </MetaInfo.Default>}
      </MetaInfo>
    );
  })();

  return (
    <div className={CN('network-information-container', className)}>
      <div className='title-wrapper'>
        <BackgroundIcon
          backgroundColor={token.colorPrimary}
          iconColor={token.colorWhite}
          phosphorIcon={Info}
          size='sm'
          weight='fill'
        />
        <div className='__title'>{t('Network Information')}</div>
      </div>
      {contentBlock}
    </div>
  );
}

const NetworkInformation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.title-wrapper': {
      display: 'flex',
      justifyContent: 'start',
      alignItems: 'center',
      gap: token.marginXS,
      marginBottom: token.marginMD + 4,
      minHeight: 40
    },

    '.__title': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      fontWeight: token.headingFontWeight
    },

    '.__current-nominator-count, .__total-nominator-count': {
      display: 'inline-flex'
    },
    '.__slash': {
      marginLeft: token.marginXXS,
      marginRight: token.marginXXS
    },

    '.__inflation': {
      marginLeft: token.marginXXS,
      color: token.colorTextLight4
    },

    '.__total-nominator-count': {
      color: token.colorTextLight4
    },

    '.-to-right': {
      textAlign: 'right'
    }
  });
});

export default NetworkInformation;
