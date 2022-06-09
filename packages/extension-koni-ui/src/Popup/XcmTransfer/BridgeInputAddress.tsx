// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainRegistry, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import FormatBalance from '@subwallet/extension-koni-ui/components/FormatBalance';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import { useTranslation } from '@subwallet/extension-koni-ui/components/translate';
import { BalanceFormatType, XcmTransferInputAddressType } from '@subwallet/extension-koni-ui/components/types';
import XcmTokenDropdown from '@subwallet/extension-koni-ui/components/XcmTokenDropdown';
import { TokenTransformOptionType } from '@subwallet/extension-koni-ui/components/XcmTokenDropdown/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

interface Props {
  className: string;
  onChange: (value: XcmTransferInputAddressType) => void;
  initValue: XcmTransferInputAddressType;
  balance: string;
  chainRegistryMap: Record<string, ChainRegistry>;
  balanceFormat: BalanceFormatType;
  networkMap: Record<string, NetworkJson>;
  options: TokenTransformOptionType[];
  networkKey: string;
}

function BridgeInputAddress ({ balance, balanceFormat, className = '', initValue, networkKey, networkMap, onChange, options }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [{ address, token }, setValue] = useState<XcmTransferInputAddressType>(initValue);

  const networkPrefix = networkMap[networkKey].ss58Format;

  const formattedAddress = useMemo<string>(() => {
    return reformatAddress(address, networkPrefix);
  }, [address, networkPrefix]);

  useEffect(() => {
    const isSync = true;

    if (isSync) {
      setValue({
        ...initValue
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initValue.token, initValue.address]);

  const onChangeInputAddress = useCallback((address: string | null) => {
    if (address) {
      setValue((prev) => {
        const newVal = {
          ...prev,
          address
        };

        onChange(newVal);

        return newVal;
      });
    } else {
      // handle null case
    }
  }, [onChange]);

  const onChangeTokenValue = useCallback((tokenValueStr: string) => {
    setValue((prev) => {
      const newVal = {
        ...prev,
        token: tokenValueStr
      };

      onChange(newVal);

      return newVal;
    });
  }, [onChange]);

  return (
    <div className={className}>
      <InputAddress
        className={'sender-input-address'}
        defaultValue={initValue.address}
        help={t<string>('The account you will transfer from.')}
        isSetDefaultValue={true}
        label={t<string>('Original Account')}
        networkPrefix={networkPrefix}
        onChange={onChangeInputAddress}
        type='account'
        withEllipsis
      />

      <div className='sender-input-address__balance'>
        <FormatBalance
          format={balanceFormat}
          value={balance}
        />
      </div>

      <div className='sender-input-address__address'>
        {toShort(formattedAddress, 4, 4)}
      </div>

      <XcmTokenDropdown
        className='sender-input-address__token-dropdown'
        networkMap={networkMap}
        onChangeTokenValue={onChangeTokenValue}
        options={options}
        value={token}
      />
    </div>
  );
}

export default styled(BridgeInputAddress)(({ theme }: ThemeProps) => `
  position: relative;
  margin-bottom: 10px;

  .sender-input-address__address {
    position: absolute;
    font-size: 14px;
    line-height: 26px;
    color: ${theme.textColor2};
    right: 70px;
    top: 36px;
    pointer-events: none;
  }

  .sender-input-address .key-pair__address {
    display: none;
  }

  .sender-input-address__balance {
    position: absolute;
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
    right: 70px;
    top: 8px;
    pointer-events: none;
  }

  .sender-input-address__token-dropdown {
    position: absolute;
    top: 0;
    right: 0;
    height: 72px;
  }

  .sender-input-address {
    .input-address-dropdown__input {
      width: 180px !important;
    }
  }

  .format-balance__value {
    font-weight: 400;
    font-size: 14px;
    color: ${theme.textColor};
  }

  .format-balance__postfix {
    color: ${theme.textColor2};
  }
`);
