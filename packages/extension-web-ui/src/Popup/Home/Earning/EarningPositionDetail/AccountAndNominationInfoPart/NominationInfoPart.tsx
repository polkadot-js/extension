// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { isAccountAll } from '@subwallet/extension-base/utils';
import { Avatar, CollapsiblePanel, MetaInfo } from '@subwallet/extension-web-ui/components';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { toShort } from '@subwallet/extension-web-ui/utils';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  compound: YieldPositionInfo;
  poolInfo: YieldPoolInfo;
  inputAsset: _ChainAsset;
};

function Component ({ className, compound,
  inputAsset,
  poolInfo }: Props) {
  const { t } = useTranslation();

  const isAllAccount = useMemo(() => isAccountAll(compound.address), [compound.address]);

  const isRelayChain = useMemo(() => _STAKING_CHAIN_GROUP.relay.includes(poolInfo.chain), [poolInfo.chain]);

  const haveNomination = useMemo(() => {
    return [YieldPoolType.NOMINATION_POOL, YieldPoolType.NATIVE_STAKING].includes(poolInfo?.type);
  }, [poolInfo.type]);

  const noNomination = useMemo(
    () => !haveNomination || isAllAccount || !compound.nominations.length,
    [compound.nominations.length, haveNomination, isAllAccount]
  );

  if (noNomination) {
    return null;
  }

  return (
    <CollapsiblePanel
      className={CN(className)}
      title={t('Nomination info')}
    >
      <MetaInfo
        labelColorScheme='gray'
        labelFontWeight='regular'
        spaceSize='ms'
      >
        {compound.nominations.map((item) => {
          return (
            <MetaInfo.Number
              className={CN('__nomination-item', {
                '-hide-number': isRelayChain
              })}
              decimals={inputAsset?.decimals || 0}
              key={item.validatorAddress}
              label={(
                <>
                  <Avatar
                    size={24}
                    value={item.validatorAddress}
                  />
                  <div className={'__nomination-name'}>
                    {item.validatorIdentity || toShort(item.validatorAddress)}
                  </div>
                </>
              )}
              suffix={inputAsset?.symbol}
              value={item.activeStake}
              valueColorSchema='even-odd'
            />
          );
        })}
      </MetaInfo>
    </CollapsiblePanel>
  );
}

export const NominationInfoPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  '.__nomination-item': {
    gap: token.sizeSM,

    '.__label': {
      'white-space': 'nowrap',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: token.sizeXS,
      overflow: 'hidden'
    },

    '.__value-col': {
      flex: '0 1 auto'
    }
  },

  '.__nomination-item.-hide-number': {
    '.__value-col': {
      display: 'none'
    }
  },

  '.__nomination-name': {
    textOverflow: 'ellipsis',
    overflow: 'hidden'
  }
}));
