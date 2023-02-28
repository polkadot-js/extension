// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import TokenItem, { TokenItemProps } from '@subwallet/react-ui/es/web3-block/token-item';
import { Button, Icon } from '@subwallet/react-ui';
import { Copy, QrCode } from 'phosphor-react';
import CopyToClipboard from 'react-copy-to-clipboard';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import useFetchChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useGetChainInfo';
import { _getChainSubstrateAddressPrefix, _isEvmChain } from '@subwallet/extension-base/services/chain-service/utils';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';

type Props = TokenItemProps & ThemeProps & {
  address?: string;
  chain?: string;
  onClickCopyBtn?: () => void;
  onClickQrBtn?: () => void;
};

function Component (
  { address, className, chain, name, subName, symbol, onClickCopyBtn, onClickQrBtn, ...restProps }: Props) {
  const chainInfo = useFetchChainInfo(chain || '');
  const notify = useNotification();
  const { t } = useTranslation();

  const formattedAddress = useMemo(() => {
    const networkPrefix = _getChainSubstrateAddressPrefix(chainInfo);
    const isEvmChain = _isEvmChain(chainInfo);
    return reformatAddress(address || '', networkPrefix, isEvmChain);
  }, []);
  const _onCLickCopyBtn = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    notify({
      message: t('Copied to clipboard')
    })
    onClickCopyBtn && onClickCopyBtn();
  }

  return (
    <div className={classNames('token-balance-selection-item', className)}>
      <TokenItem
        {...restProps}
        isShowSubLogo
        symbol={symbol?.toLowerCase()}
        name={name}
        subName={chainInfo.name}
        networkMainLogoShape='squircle'
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
        rightItem={
          (
            <>
              <CopyToClipboard text={formattedAddress}>
                <Button onClick={_onCLickCopyBtn} size='xs' type='ghost' icon={<Icon phosphorIcon={Copy} size='sm' />} />
              </CopyToClipboard>
              <Button onClick={onClickQrBtn} size='xs' type='ghost' icon={<Icon phosphorIcon={QrCode} size='sm' />} />
            </>
          )
        }
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
    },
  });
});
