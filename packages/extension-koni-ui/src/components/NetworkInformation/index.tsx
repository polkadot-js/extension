// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import CN from 'classnames';
import { MetaInfo } from '../MetaInfo';
import { useTranslation } from 'react-i18next';
import { BackgroundIcon, Number } from '@subwallet/react-ui';
import { Info } from 'phosphor-react';
import { useGetChainStakingMetadata, useGetNativeTokenBasicInfo } from '@subwallet/extension-koni-ui/hooks';
import { TransactionContext } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { getUnstakingPeriod } from '@subwallet/extension-koni-ui/Popup/Transaction/helper';

interface Props extends ThemeProps {
  stakeStype?: StakingType
}

function Component (props: Props): React.ReactElement<Props> {
  const { className = '', stakeStype } = props;
  const { t } = useTranslation();
  const { chain } = useContext(TransactionContext);
  const { token } = useTheme() as Theme

  const chainStakingMetadata = useGetChainStakingMetadata(chain);
  const { decimals, symbol } = useGetNativeTokenBasicInfo(chain);

  const minStake = useMemo(() =>
    stakeStype === StakingType.POOLED ? chainStakingMetadata?.minPoolBonding || '0' : chainStakingMetadata?.minStake || '0'
  , [chainStakingMetadata?.minPoolBonding, chainStakingMetadata?.minStake, stakeStype]
  );

  const getMetaInfo = useCallback(() => {
    if (chainStakingMetadata) {
      return (
        <>
          {
            chainStakingMetadata.expectedReturn &&
            (
              <MetaInfo.Number
                label={t('Estimated earnings:')}
                suffix={'%'}
                value={chainStakingMetadata.expectedReturn}
              />
            )
          }

          {
            chainStakingMetadata.minStake &&
            (
              <MetaInfo.Number
                decimals={decimals}
                label={t('Minimum active:')}
                suffix={symbol}
                value={minStake}
                valueColorSchema={'success'}
              />
            )
          }
        </>
      );
    }

    return null;
  }, [chainStakingMetadata, decimals, symbol, t, minStake]);

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
        <div className='alert-title'>{t('Network Information')}</div>
      </div>
      <MetaInfo
        // className={CN(className)}
        hasBackgroundWrapper
        spaceSize='ms'
        valueColorScheme='light'
      >
        {chainStakingMetadata?.nominatorCount && <MetaInfo.Default
          label={t('Active nominators')}
          labelAlign={'top'}
        >
          <div className={'__active-nominators-value'}>
            <Number
              className={'__current-nominator-count'}
              decimal={0}
              decimalOpacity={1}
              intOpacity={1}
              unitOpacity={1}
              value={chainStakingMetadata.nominatorCount}
            />
            <span className={'__slash'}>/</span>
            <Number
              className={'__total-nominator-count'}
              decimal={0}
              decimalOpacity={1}
              intOpacity={1}
              unitOpacity={1}
              value={1}
            />
          </div>
        </MetaInfo.Default>}
        {getMetaInfo()}
        {chainStakingMetadata?.unstakingPeriod && <MetaInfo.Default label={t('Unstaking period')}>
          <span>{getUnstakingPeriod(chainStakingMetadata.unstakingPeriod)}</span>
        </MetaInfo.Default>}
        <MetaInfo.Default label={t('Total chainstake')}>
          <span>Total chainstake</span>
        </MetaInfo.Default>
      </MetaInfo>
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
    },
    '.__current-nominator-count, .__total-nominator-count': {
      display: 'inline-flex'
    },
  });
});

export default NetworkInformation;
