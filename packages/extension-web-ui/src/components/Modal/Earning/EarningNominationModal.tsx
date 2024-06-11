// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { YieldPositionInfo } from '@subwallet/extension-base/types';
import { Avatar, BaseModal, MetaInfo } from '@subwallet/extension-web-ui/components';
import { EARNING_NOMINATION_MODAL } from '@subwallet/extension-web-ui/constants';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { toShort } from '@subwallet/extension-web-ui/utils';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel: () => void,
  item: YieldPositionInfo | undefined;
  inputAsset: _ChainAsset;
};

function Component ({ className, inputAsset, item, onCancel }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const isRelayChain = useMemo(() => _STAKING_CHAIN_GROUP.relay.includes(item?.chain || ''), [item?.chain]);

  return (
    <BaseModal
      className={className}
      id={EARNING_NOMINATION_MODAL}
      onCancel={onCancel}
      title={t('Nomination info')}
    >
      {
        !!item?.nominations?.length && (
          <MetaInfo
            hasBackgroundWrapper={true}
            labelColorScheme='gray'
            labelFontWeight='regular'
            spaceSize='ms'
          >
            {item?.nominations.map((nomination) => {
              return (
                <MetaInfo.Number
                  className={CN('__nomination-item', {
                    '-hide-number': isRelayChain
                  })}
                  decimals={inputAsset?.decimals || 0}
                  key={nomination.validatorAddress}
                  label={(
                    <>
                      <Avatar
                        size={24}
                        value={nomination.validatorAddress}
                      />
                      <div className={'__nomination-name'}>
                        {nomination.validatorIdentity || toShort(nomination.validatorAddress)}
                      </div>
                    </>
                  )}
                  suffix={inputAsset?.symbol}
                  value={nomination.activeStake}
                  valueColorSchema='even-odd'
                />
              );
            })}
          </MetaInfo>
        )
      }
    </BaseModal>
  );
}

const EarningPoolDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.__nomination-item': {
      gap: token.sizeSM,

      '.__label': {
        'white-space': 'nowrap',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: token.sizeXS,
        overflow: 'hidden'
      }
    },

    '.__nomination-item.-hide-number': {
      '.__value-col': {
        display: 'none'
      }
    },

    '.__nomination-name': {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      color: token.colorWhite
    }
  });
});

export default EarningPoolDetailModal;
