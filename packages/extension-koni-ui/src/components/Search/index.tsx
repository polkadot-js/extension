// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Input } from '@subwallet/react-ui';
import CN from 'classnames';
import { MagnifyingGlass } from 'phosphor-react';
import React, { ChangeEventHandler, useCallback } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  placeholder: string
  className?: string
  searchValue: string,
  onSearch: (value: string) => void;
  onClickActionBtn?: () => void;
  actionBtnIcon?: JSX.Element;
  showActionBtn?: boolean;
}

const Component: React.FC<Props> = ({ actionBtnIcon,
  className,
  onClickActionBtn,
  onSearch,
  placeholder,
  searchValue,
  showActionBtn }) => {
  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    const value = e?.target?.value;

    onSearch(value);
  },
  [onSearch]
  );

  return (
    <div className={CN(className)}>
      <Input.Search
        className='__search-input'
        onChange={handleInputChange}
        placeholder={placeholder}
        prefix={<Icon phosphorIcon={MagnifyingGlass} />}
        size='md'
        suffix={
          showActionBtn && (
            <Button
              icon={actionBtnIcon}
              onClick={onClickActionBtn}
              size='xs'
              type='ghost'
            />
          )
        }
        value={searchValue}
        // onKeyDown={handleKeyDown}
      />
    </div>
  );
};

const Search = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__search-input': {
      width: 360,
      height: 48
    }
  };
});

export default Search;
