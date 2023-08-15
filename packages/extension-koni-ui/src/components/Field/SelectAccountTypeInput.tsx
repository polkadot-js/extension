// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { InputRef } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { ForwardedRef, forwardRef, useCallback } from 'react';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

import SelectAccountType from '../Account/SelectAccountType';

type Props = BasicInputWrapper<KeypairType[]> & ThemeProps;

const Component: React.ForwardRefRenderFunction<InputRef, Props> = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { className, label, onChange, value } = props;

  const _onChange: React.Dispatch<React.SetStateAction<KeypairType[]>> = useCallback((change) => {
    if (typeof change === 'function') {
      onChange?.({ target: { value: change(value || []) as unknown as string } });
    } else {
      onChange?.({ target: { value: change as unknown as string } });
    }
    // Prevent onChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <SelectAccountType
      className={CN(className)}
      label={label}
      selectedItems={value || []}
      setSelectedItems={_onChange}
      withLabel={!!label}
    />
  );
};

const SelectAccountTypeInput = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default SelectAccountTypeInput;
