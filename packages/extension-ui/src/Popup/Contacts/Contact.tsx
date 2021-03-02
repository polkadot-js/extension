// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import EditIcon from '../../assets/edit.svg';
import { ActionContext, Identicon, Svg } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props extends ThemeProps {
  className?: string;
}

function Contact ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const _goToContactEdit = useCallback(
    () => {
      onAction('edit-contact');
    }, [onAction]
  );

  return (
    <div className={className}>
      <div className='infoRow'>
        <Identicon
          className='identityIcon'
          value={'5G9m5GUdXbdK6Yi78hV9pEuX66Fm3bpDeU3YvGF4od6pix6A'}
        />
        <div>
          <div>
            <text className={'nickname'}>Alice Marble</text>
          </div>
          <div className='fullAddress'>
            <text>5G9m5GUdXbdK6Yi78hV9pEuX66Fm3bpDeU3YvGF4od6pix6A</text>
          </div>

        </div>
        <div onClick={_goToContactEdit}>
          <Svg
            className='edit'
            src={EditIcon}
          />
        </div>
      </div>
    </div>
  );
}

export default styled(Contact)(({ theme }: Props) => `
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  background: ${theme.accountBackground};
  border: 1px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  border-radius: 4px;
  margin-bottom: 8px;
  position: relative;

  .fullAddress {
    overflow: hidden;
    text-overflow: ellipsis;
    color: ${theme.labelColor};
    font-size: 12px;
    line-height: 16px;
  }
  
  .edit {
    position: absolute;
    right: 10px;
    bottom: 20px;
    width: 20px;
    height: 20px;
  }

  .infoRow {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 72px;
    border-radius: 4px;
  }

  .identityIcon {
    margin-left: 15px;
    margin-right: 10px;

    & svg {
      width: 50px;
      height: 50px;
    }
  }
`);
