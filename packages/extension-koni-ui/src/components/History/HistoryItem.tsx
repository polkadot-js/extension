// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionDirection } from '@subwallet/extension-base/background/KoniTypes';
import { getExplorerLink } from '@subwallet/extension-base/services/transaction-service/utils';
import { HistoryStatusMap } from '@subwallet/extension-koni-ui/constants';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps, TransactionHistoryDisplayItem } from '@subwallet/extension-koni-ui/types';
import { openInNewTab, toShort } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, Logo, Number, Tag, Typography, Web3Block } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import CN from 'classnames';
import moment from 'moment';
import { ArrowSquareOut, CaretRight } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  item: TransactionHistoryDisplayItem,
  onClick?: () => void,
};

function Component (
  { className = '', item, onClick }: Props) {
  const displayData = item.displayData;
  const { isWebUI } = useContext(ScreenContext);
  const { isShowBalance } = useSelector((state) => state.settings);

  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);

  const chainInfo = chainInfoMap[item.chain];
  const time = moment(item.time).format('hh:mm A');
  const link = !!item.extrinsicHash && getExplorerLink(chainInfo, item.extrinsicHash, 'tx');

  const handleOnClick = useCallback(
    (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      link && openInNewTab(link)();
    },
    [link]);

  if (!isWebUI) {
    return (
      <Web3Block
        className={CN('history-item', className, displayData.className)}
        leftItem={(
          <>
            <div className={'__main-icon-wrapper'}>
              <Icon
                className={'__main-icon'}
                phosphorIcon={displayData.icon}
                size={'md'}
              />
              <Logo
                className={'__chain-logo'}
                network={item.chain}
                size={16}
              />
            </div>
          </>
        )}
        middleItem={(
          <>
            <div className={'__account-name'}>{item.direction === TransactionDirection.SEND ? (item.fromName || item.from || '') : (item.toName || item.to || '')}</div>
            <div className={'__meta'}>{displayData.typeName}</div>
          </>
        )}
        onClick={onClick}
        rightItem={(
          <>
            <div className={'__value-wrapper'}>
              <Number
                className={'__value'}
                decimal={item?.amount?.decimals || 0}
                decimalOpacity={0.45}
                hide={!isShowBalance}
                suffix={item?.amount?.symbol}
                value={item?.amount?.value || '0'}
              />
              <Number
                className={'__fee'}
                decimal={item?.fee?.decimals || 0}
                decimalOpacity={0.45}
                hide={!isShowBalance}
                intOpacity={0.45}
                suffix={item.fee?.symbol}
                unitOpacity={0.45}
                value={item.fee?.value || '0'}
              />
            </div>
            <div className={'__arrow-icon'}>
              <Icon
                phosphorIcon={CaretRight}
                size='sm'
              />
            </div>
          </>
        )}
      />
    );
  }

  return (
    <div
      className={CN(className, displayData.className, '__web-ui')}
      onClick={onClick}
    >
      <div className='account-wrapper'>
        <SwAvatar
          size={30}
          value={item.address}
        />
        <div className='account-info'>
          <Typography.Text>{item.direction === TransactionDirection.SEND ? (item.fromName || item.from || '') : (item.toName || item.to || '')}</Typography.Text>
          <Typography.Text className='account-address'>{toShort(item.address)}</Typography.Text>
        </div>
      </div>

      <div className='status-wrapper'>
        <div className={'__main-icon-wrapper'}>
          <Icon
            className={'__main-icon'}
            iconColor='success'
            phosphorIcon={displayData.icon}
            size={'md'}
          />
          <Logo
            className={'__chain-logo'}
            network={item.chain}
            size={16}
          />
        </div>
        <div>
          <div className={'__account-name'}>{item.displayData.name}</div>
          <div className={'__meta'}>{time}</div>
        </div>
      </div>

      <div className='value-wrapper'>
        <Number
          className={'__value'}
          decimal={item?.amount?.decimals || 0}
          decimalOpacity={0.45}
          suffix={item?.amount?.symbol}
          value={item?.amount?.value || '0'}
        />
        <Number
          className={'__fee'}
          decimal={item?.fee?.decimals || 0}
          decimalOpacity={0.45}
          intOpacity={0.45}
          suffix={item.fee?.symbol}
          unitOpacity={0.45}
          value={item.fee?.value || '0'}
        />
      </div>

      <div className='status-tag'>
        <Tag
          className='tag'
          color={HistoryStatusMap[item.status].schema}
        >
          {HistoryStatusMap[item.status].name}
        </Tag>

        <Button
          icon={<Icon
            phosphorIcon={ArrowSquareOut}
            size='sm'
          />}
          onClick={handleOnClick}
          type='ghost'
        />
      </div>
    </div>
  );
}

export const HistoryItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,
    paddingTop: 0,
    paddingBottom: 0,
    minHeight: 68,

    '&:not(.__web-ui) .ant-number .ant-typography': {
      fontSize: 'inherit !important',
      fontWeight: 'inherit !important',
      lineHeight: 'inherit'
    },

    '.__main-icon-wrapper': {
      position: 'relative',
      width: 40,
      height: 40,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',

      '&:before': {
        content: '""',
        display: 'block',
        opacity: 0.1,
        borderRadius: '100%',
        position: 'absolute',
        inset: 0
      }
    },

    '.__chain-logo': {
      position: 'absolute',
      right: 0,
      bottom: 0
    },

    '.ant-web3-block-middle-item': {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      paddingLeft: token.sizeXS,
      paddingRight: token.sizeXS
    },

    '.__account-name, .__meta': {
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    '.__account-name, .__value': {
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextLight1,
      fontWeight: token.headingFontWeight
    },

    '.__meta, .__fee': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4
    },

    '.__value-wrapper': {
      textAlign: 'right'
    },

    '.__arrow-icon': {
      width: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: token.colorTextLight4
    },

    '&:hover': {
      color: token.colorTextLight2
    },

    '&.-processing': {
      '.__main-icon-wrapper:before': {
        backgroundColor: token['gold-6']
      },
      '.__main-icon': {
        color: token['gold-6']
      },
      '.__meta': {
        color: token['gold-6']
      }
    },

    '&.-fail': {
      '.__main-icon-wrapper:before': {
        backgroundColor: token.colorError
      },
      '.__main-icon': {
        color: token.colorError
      }
    },

    '&.-cancelled': {
      '.__main-icon-wrapper:before': {
        backgroundColor: token['gray-6']
      },
      '.__main-icon': {
        color: token['gray-6']
      }
    },

    '&.-success': {
      '.__main-icon-wrapper:before': {
        backgroundColor: token.colorSuccess
      },
      '.__main-icon': {
        color: token.colorSuccess
      }
    },

    '&.__web-ui': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: 12,
      marginBottom: 8,
      cursor: 'pointer',

      '& > *': {
        width: '25%',
        flex: 1
      },
      '.__account-name': {
        fontWeight: 500
      },

      '&:hover': {

      },

      '.status-wrapper': {
        display: 'flex',
        justifyContent: 'center',
        '.__main-icon-wrapper': {
          marginRight: 8
        }
      },

      '.account-wrapper': {
        display: 'inline-flex',
        alignItems: 'center',

        '.account-info': {
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 8,

          '.account-address': {
            color: 'rgba(255, 255, 255, 0.45)',
            fontSize: '12px',
            lineHeight: '20px',
            fontWeight: 500
          }
        }
      },

      '.status-tag': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end'
      },

      '.value-wrapper': {
        textAlign: 'right'
      }
    }
  });
});
