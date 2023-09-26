// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _MANTA_ZK_CHAIN_GROUP, _ZK_ASSET_PREFIX } from '@subwallet/extension-base/services/chain-service/constants';
import { _getChainSubstrateAddressPrefix } from '@subwallet/extension-base/services/chain-service/utils';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useFetchChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useFetchChainInfo';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import reformatAddress from '@subwallet/extension-koni-ui/utils/account/reformatAddress';
import { Button, Icon } from '@subwallet/react-ui';
import TokenItem, { TokenItemProps } from '@subwallet/react-ui/es/web3-block/token-item';
import classNames from 'classnames';
import { Copy, QrCode } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from 'styled-components';

type Props = TokenItemProps & ThemeProps & {
  address?: string;
  chain?: string;
  slug: string;
  onClickCopyBtn?: () => void;
  onClickQrBtn?: () => void;
};

const Component = (props: Props) => {
  const { address, chain, className, name, onClickCopyBtn, onClickQrBtn, onPressItem, slug, symbol, ...restProps } = props;
  const chainInfo = useFetchChainInfo(chain || '');
  const notify = useNotification();
  const { t } = useTranslation();

  const formattedAddress = useMemo(() => {
    const networkPrefix = _getChainSubstrateAddressPrefix(chainInfo);
    const isEvmChain = !!chainInfo.evmInfo;

    if (_MANTA_ZK_CHAIN_GROUP.includes(chainInfo.slug) && symbol?.startsWith(_ZK_ASSET_PREFIX)) { // TODO: improve this
      return address || '';
    }

    return reformatAddress(address || '', networkPrefix, isEvmChain);
  }, [address, chainInfo, symbol]);

  const _onCLickCopyBtn = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    notify({
      message: t('Copied to clipboard')
    });
    onClickCopyBtn && onClickCopyBtn();
  }, [notify, onClickCopyBtn, t]);

  return (
    <div className={classNames('token-selection-item', className)}>
      <TokenItem
        {...restProps}
        isShowSubLogo
        middleItem={
          (
            <>
              <div className={'ant-network-item-name'}>{symbol}</div>
              <div className={'__chain-name'}>
                {chainInfo.name}
              </div>
            </>
          )
        }
        name={name}
        networkMainLogoShape='squircle'
        networkMainLogoSize={40}
        onPressItem={_MANTA_ZK_CHAIN_GROUP.includes(chainInfo.slug) && symbol?.startsWith(_ZK_ASSET_PREFIX) ? undefined : onPressItem }
        rightItem={
          (
            <>
              <CopyToClipboard text={formattedAddress}>
                <Button
                  icon={
                    <Icon
                      phosphorIcon={Copy}
                      size='sm'
                    />
                  }
                  onClick={_onCLickCopyBtn}
                  size='xs'
                  tooltip={t('Copy address')}
                  type='ghost'
                />
              </CopyToClipboard>
              <Button
                disabled={_MANTA_ZK_CHAIN_GROUP.includes(chainInfo.slug) && symbol?.startsWith(_ZK_ASSET_PREFIX)}
                icon={
                  <Icon
                    phosphorIcon={QrCode}
                    size='sm'
                  />
                }
                onClick={onClickQrBtn}
                size='xs'
                tooltip={t('Show QR code')}
                type='ghost'
              />
            </>
          )
        }
        subName={chainInfo.name}
        symbol={slug.toLowerCase()}
      />
    </div>
  );
};

export const TokenSelectionItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-web3-block': {
      padding: token.paddingSM
    },

    '.ant-web3-block-middle-item': {
      '.ant-number': {
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeightSM
      }
    },

    '.__chain-name': {
      color: token.colorTextLight4,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM
    },

    '.ant-loading-icon': {
      color: 'inherit !important'
    },

    '.__icon-wrapper': {
      width: 40,
      display: 'flex',
      justifyContent: 'center',
      color: token.colorTextLight4
    },

    '.ant-btn-ghost': {
      color: token.colorTextLight3
    },

    '.ant-btn-ghost:hover': {
      color: token.colorTextLight2
    },

    '.ant-balance-item-content:hover': {
      '.__icon-wrapper': {
        color: token.colorTextLight2
      }
    }
  });
});
