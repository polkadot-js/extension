// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon, Logo } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  slug: string;
  haveToPay: string,
  symbol: string;
  availableBalance: string,
  selected?: boolean,
  onSelect?: (slug: string) => void,
}

const Component: React.FC<Props> = (props: Props) => {
  const { availableBalance, className, haveToPay, onSelect, selected, slug, symbol } = props;
  const _onSelect = useCallback(() => {
    onSelect?.(slug);
  }, [onSelect, slug]);

  return (
    <>
      <div
        className={CN(className, '__choose-fee-item-wrapper')}
        onClick={_onSelect}
      >
        <div className={'__left-part'}>
          <Logo
            className='token-logo'
            isShowSubLogo={false}
            shape='squircle'
            size={40}
            token={slug.toLowerCase()}
          />
          <div className={'__fee-info'}>
            <div className={'__line-1'}>
              <span>{haveToPay}&nbsp;{symbol}</span>
            </div>
            <div className={'__line-2' }>
              <span>Available:</span>
            &nbsp;<span>{availableBalance}&nbsp;{symbol}</span>
            </div>
          </div>
        </div>
        {selected && (
          <Icon
            className='check-icon'
            phosphorIcon={CheckCircle}
            size='md'
            weight='fill'
          />
        )}
      </div>
    </>
  );
};

const ChooseFeeItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: token.colorBgSecondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    '.__left-part': {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    },
    '.__fee-info': {
      fontSize: 16,
      lineHeight: token.lineHeightLG,
      fontWeight: token.fontWeightStrong,
      color: token.colorWhite
    },
    '.__line-2': {
      fontSize: 12,
      lineHeight: token.lineHeightSM,
      fontWeight: token.bodyFontWeight,
      color: token.colorTextTertiary
    },
    '.check-icon': {
      color: token.colorSuccess
    }
  };
});

export default ChooseFeeItem;
