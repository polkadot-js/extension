// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, Input } from '@subwallet/react-ui';
import CN from 'classnames';
import { DownloadSimple, MagnifyingGlass } from 'phosphor-react';
import React, { ChangeEventHandler, useCallback, useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  placeholder: string
  className?: string
  searchValue: string,
  onSearch: (value: string) => void;
  onClickActionBtn?: () => void;
  actionBtnIcon?: JSX.Element;
  showActionBtn?: boolean;
  extraButton?: JSX.Element
  showExtraButton?: boolean
}

const Component: React.FC<Props> = ({ actionBtnIcon,
  className,
  extraButton,
  onClickActionBtn,
  onSearch,
  placeholder,
  searchValue,
  showActionBtn,
  showExtraButton = false }) => {
  // CONTROLLED STATE
  // const [value, setValue] = useState<string>(searchValue)

  // const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback((e) => {
  //   if (e.key === 'Enter' && value) {
  //     onSearch(value)
  //   }
  // }, [value])

  // const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
  //   const value = e?.target?.value;
  //   setValue(value)
  // }

  // UNCONTROLLED STATE
  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    const value = e?.target?.value;

    onSearch(value);
  },
  [onSearch]
  );

  const button = useMemo(() => extraButton || (
    <Button
      icon={<Icon
        phosphorIcon={DownloadSimple}
        size='sm'
      />}
      type='ghost'
    />
  ), [extraButton]);

  return (
    <div className={CN('search-container', className)}>
      <div className='right-section'>
        {showExtraButton && button}
        <Input.Search
          className='search-input'
          onChange={handleInputChange}
          placeholder={placeholder}
          prefix={<Icon phosphorIcon={MagnifyingGlass} />}
          size='md'
          value={searchValue}
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
          // onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};

const Search = styled(Component)<Props>(() => {
  return {
    display: 'grid',
    width: '100%',

    '.right-section': {
      justifySelf: 'end',
      display: 'flex',
      '.search-input': {
        width: 360,
        height: 50
      }
    }
  };
});

export default Search;
