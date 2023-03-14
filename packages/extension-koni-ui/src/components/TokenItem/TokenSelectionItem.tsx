// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getChainSubstrateAddressPrefix } from '@subwallet/extension-base/services/chain-service/utils';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useFetchChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useFetchChainInfo';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
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
  onClickCopyBtn?: () => void;
  onClickQrBtn?: () => void;
};

function Component (
  { address, chain, className, name, onClickCopyBtn, onClickQrBtn, symbol, ...restProps }: Props) {
  const chainInfo = useFetchChainInfo(chain || '');
  const notify = useNotification();
  const { t } = useTranslation();

  const formattedAddress = useMemo(() => {
    const networkPrefix = _getChainSubstrateAddressPrefix(chainInfo);
    const isEvmChain = !!chainInfo.evmInfo;

    return reformatAddress(address || '', networkPrefix, isEvmChain);
  }, [address, chainInfo]);

  const _onCLickCopyBtn = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    notify({
      message: t('Copied to clipboard')
    });
    onClickCopyBtn && onClickCopyBtn();
  }, [notify, onClickCopyBtn, t]);

  return (
    <div className={classNames('token-balance-selection-item', className)}>
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
        rightItem={
          (
            <>
              <CopyToClipboard text={formattedAddress}>
                <Button
                  icon={<Icon
                    phosphorIcon={Copy}
                    size='sm'
                  />}
                  onClick={_onCLickCopyBtn}
                  size='xs'
                  type='ghost'
                />
              </CopyToClipboard>
              <Button
                icon={<Icon
                  phosphorIcon={QrCode}
                  size='sm'
                />}
                onClick={onClickQrBtn}
                size='xs'
                type='ghost'
              />
            </>
          )
        }
        subName={chainInfo.name}
        symbol={symbol?.toLowerCase()}
      />
    </div>
  );
}

export const TokenSelectionItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.__chain-name': {
      color: token.colorTextLight4,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM
    }
  });
});
