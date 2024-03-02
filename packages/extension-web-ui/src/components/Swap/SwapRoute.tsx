// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SwapRoute as SwapRouteType } from '@subwallet/extension-base/types/swap';
import { TokenItemType } from '@subwallet/extension-web-ui/components';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps, TokenSelectorItemType } from '@subwallet/extension-web-ui/types';
import { Logo } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  swapRoute: SwapRouteType;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, swapRoute } = props;
  const assetRegistryMap = useSelector((state) => state.assetRegistry.assetRegistry);

  const getSwapRoute = useMemo(() => {
    const results: TokenSelectorItemType[] = [];

    swapRoute.path.forEach((slug) => {
      const asset = assetRegistryMap[slug];

      if (asset) {
        results.push({
          originChain: asset.originChain,
          slug,
          symbol: asset.symbol,
          name: asset.name
        });
      }
    });

    return results;
  }, [assetRegistryMap, swapRoute.path]);

  return (
    <>
      <div className={CN(className, '__swap-route-container')}>
        <div className='__first-separator'>
          <div className='__arrow'></div>
        </div>
        {getSwapRoute.map((result, index) => (
          <div
            className={CN('__token-item', {
              '-is-first': index === 0,
              '-is-last': index === getSwapRoute.length - 1,
              '-is-center': (index !== 0) && (index !== getSwapRoute.length - 1)
            })}
            key={index}
          >
            <Logo
              className='token-logo'
              isShowSubLogo={false}
              shape='squircle'
              size={24}
              token={result.slug.toLowerCase()}
            />
            <span className='__token-item-symbol'>{result.symbol}</span>
          </div>
        ))}
      </div>
    </>
  );
};

const SwapRoute = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative',
    '.__token-item': {
      height: 48,
      flexDirection: 'column',
      gap: 4,
      justifyContent: 'center',
      alignItems: 'center'
    },
    '.__token-item.-is-first': {
      alignItems: 'flex-start',
      '.__token-item-symbol': {
      }
    },
    '.__token-item.-is-center': {
      '.__token-item-symbol': {
        left: '50%',
        transform: 'translateX(-50%)'
      }
    },
    '.__token-item.-is-last': {
      alignItems: 'flex-end',
      '.__token-item-symbol': {
        right: 3
      }
    },
    '.__first-separator': {
      position: 'absolute',
      height: 2,
      backgroundColor: token['gray-3'],
      marginTop: 12,
      marginBottom: 16,
      left: 33,
      right: 40
    },
    '.__token-item-symbol': {
      fontSize: token.fontSizeSM,
      fontWeight: token.bodyFontWeight,
      lineHeight: token.lineHeightSM,
      color: token.colorTextTertiary,
      position: 'absolute',
      whitespace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      maxWidth: 70
    },

    '.__arrow': {
      right: -6,
      top: -4,
      position: 'absolute',
      width: 0,
      height: 0,
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
      borderLeft: `6px solid ${token['gray-3']}`
    }
  };
});

export default SwapRoute;
