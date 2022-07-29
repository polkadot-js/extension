// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Dropdown from '@subwallet/extension-koni-ui/components/Dropdown';
import { BOND_DURATION_OPTIONS } from '@subwallet/extension-koni-ui/Popup/Bonding/utils';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  networkKey: string;
  handleSelectValidator: (value: string) => void;
}

function BondDurationDropdown ({ className, handleSelectValidator, networkKey }: Props): React.ReactElement<Props> {
  const getDropdownOptions = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return BOND_DURATION_OPTIONS[networkKey] || BOND_DURATION_OPTIONS.default;
  }, [networkKey]);

  return (
    <div className={className}>
      <Dropdown
        label={'Select a locking period (*)'}
        onChange={handleSelectValidator}
        options={getDropdownOptions()}
      />
    </div>
  );
}

export default React.memo(styled(BondDurationDropdown)(({ theme }: Props) => `
  margin-top: 20px;
`));
