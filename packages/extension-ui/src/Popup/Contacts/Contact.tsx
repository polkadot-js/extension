// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import EditIcon from '../../assets/edit.svg';
import { ActionContext, Svg } from '../../components';
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
      <div>
        <div>
          <text className={'nickname'}>Alice Marble</text>
        </div>
        <div className='fullAddress'
          style={{ width: '100%' }}>
          <text>5G9m5GUdXbdK6Yi78hV9pEuX66Fm3bpDeU3YvGF4od6pix6A</text>
        </div>

      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          onClick={_goToContactEdit}
          style={{ alignSelf: 'flex-end' }}
        >
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
  height: 60px;

  .fullAddress {
    overflow: hidden;
    text-overflow: ellipsis;
    color: ${theme.labelColor};
    font-size: 12px;
    line-height: 16px;
  }
  
  .edit {
    width: 20px;
    height: 20px;
  }
`);
