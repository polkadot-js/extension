// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DelegationItem } from '@subwallet/extension-base/background/KoniTypes';
import Dropdown from '@subwallet/extension-koni-ui/components/Dropdown';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  delegations: DelegationItem[],
  handleSelectValidator: (value: string) => void;
  label?: string;
}

function ValidatorsDropdown ({ className, delegations, handleSelectValidator, label }: Props): React.ReactElement<Props> {
  const getDropdownOptions = useCallback(() => {
    return delegations.map((item) => {
      return {
        text: item.identity ? `${item.identity} (${toShort(item.owner)})` : `${toShort(item.owner)}`,
        value: item.owner
      };
    });
  }, [delegations]);

  return (
    <div className={className}>
      <Dropdown
        label={label || 'Select a collator (*)'}
        onChange={handleSelectValidator}
        options={getDropdownOptions()}
      />
    </div>
  );
}

export default React.memo(styled(ValidatorsDropdown)(({ theme }: Props) => `
  margin-top: 20px;
`));
