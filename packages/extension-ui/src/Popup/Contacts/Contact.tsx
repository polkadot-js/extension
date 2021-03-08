// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import queryString from 'query-string';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import { ContactProps } from '@polkadot/extension-ui/types';

import EditIcon from '../../assets/edit.svg';
import { ActionContext, Identicon, Svg } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props extends ContactProps {
  className?: string;
}

function Contact ({ className = '', contact }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const _goToContactEdit = useCallback(
    () => {
      const stringified = queryString.stringifyUrl({ url: 'edit-contact', query: { ...contact } });

      onAction(stringified);
    }, [onAction]
  );

  return (
    <div className={className}>
      <div className='infoRow'>
        <Identicon
          className='identityIcon'
          value={contact.address}
        />
        <div>
          <div>
            <text className={'nickname'}>{contact.name}</text>
          </div>
          <div className='fullAddress'>
            <text>{contact.address}</text>
          </div>

        </div>

        <div
          className='banner chain'
          data-field='chain'
          style={{ backgroundColor: 'rgb(255, 125, 1)' }}
        >
          {contact.network}
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

  .banner {
    font-size: 12px;
    line-height: 16px;
    position: absolute;
    top: 0;

    &.chain {
      background: ${theme.primaryColor};
      border-radius: 0 0 0 10px;
      color: white;
      padding: 0.1rem 0.5rem 0.1rem 0.75rem;
      right: 0;
      z-index: 1;
    }
  }
`);
