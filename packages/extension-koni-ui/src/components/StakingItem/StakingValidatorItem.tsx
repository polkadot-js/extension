// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ValidatorDataType } from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetValidatorList';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Web3Block } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import { DotsThree } from 'phosphor-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ValidatorDataType & ThemeProps & {
  onClickMoreBtn: () => void;
}

const Component: React.FC<Props> = (props: Props) => {
  const { address, className, commission, identity, onClickMoreBtn } = props;

  const { t } = useTranslation();

  return (
    <Web3Block
      className={className}
      leftItem={
        <SwAvatar
          identPrefix={42}
          size={40}
          theme={isEthereumAddress(address) ? 'ethereum' : 'polkadot'}
          value={address}
        />
      }
      middleItem={
        <div className={'middle-item'}>
          <div className={'middle-item__name'}>{identity}</div>
          <div className={'middle-item__commission'}>
            {t(`Commission ${commission} %`)}
          </div>
        </div>
      }

      rightItem={
        <Button
          icon={
            <Icon phosphorIcon={DotsThree} />
          }
          onClick={onClickMoreBtn}
          size='xs'
          type='ghost'
        />
      }
    />
  );
};

const StakingValidatorItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    padding: token.paddingSM,
    borderRadius: token.borderRadiusLG,
    background: token.colorBgSecondary,

    '.middle-item__name': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG
    },

    '.middle-item__commission': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4
    }
  };
});

export default StakingValidatorItem;
