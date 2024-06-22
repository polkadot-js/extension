// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicType, TransactionAdditionalInfo, TransactionDirection } from '@subwallet/extension-base/background/KoniTypes';
import { getExplorerLink } from '@subwallet/extension-base/services/transaction-service/utils';
import { HistoryStatusMap } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { getBalanceValue, getConvertedBalanceValue } from '@subwallet/extension-web-ui/hooks/screen/home/useAccountBalance';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps, TransactionHistoryDisplayItem } from '@subwallet/extension-web-ui/types';
import { customFormatDate, isAbleToShowFee, openInNewTab, toShort } from '@subwallet/extension-web-ui/utils';
import { Button, Icon, Logo, Number, Tag, Typography, Web3Block } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import CN from 'classnames';
import { ArrowSquareOut, CaretRight } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps & {
  item: TransactionHistoryDisplayItem,
  onClick?: () => void,
};

function getLink (data: TransactionHistoryDisplayItem, chainInfoMap: Record<string, _ChainInfo>) {
  const extrinsicType = data.type;
  const chainInfo = chainInfoMap[data.chain];
  let originChainInfo = chainInfo;

  if (extrinsicType === ExtrinsicType.TRANSFER_XCM && data.additionalInfo) {
    const additionalInfo = data.additionalInfo as TransactionAdditionalInfo[ExtrinsicType.TRANSFER_XCM];

    originChainInfo = chainInfoMap[additionalInfo.originalChain] || chainInfo;
  }

  if (data.extrinsicHash && data.extrinsicHash !== '') {
    return getExplorerLink(originChainInfo, data.extrinsicHash, 'tx');
  }

  return undefined;
}

function Component (
  { className = '', item, onClick }: Props) {
  const { t } = useTranslation();
  const displayData = item.displayData;
  const { isWebUI } = useContext(ScreenContext);
  const { isShowBalance } = useSelector((state) => state.settings);

  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const priceMap = useSelector((state: RootState) => state.price.priceMap);
  const chainAssetMap = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const { currencyData } = useSelector((state: RootState) => state.price);

  const time = customFormatDate(item.time, '#hhhh#:#mm#');
  const link = getLink(item, chainInfoMap);

  const showAmount = useMemo(() => item.type !== ExtrinsicType.TOKEN_SPENDING_APPROVAL, [item.type]);

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
                decimalOpacity={showAmount ? 0.45 : 0}
                hide={!isShowBalance}
                intOpacity={showAmount ? 1 : 0}
                suffix={item?.amount?.symbol}
                value={item?.amount?.value || '0'}
              />
              <Number
                className={CN('__fee', {
                  '-hide': !isAbleToShowFee(item)
                })}
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

  const chainAsset = Object.values(chainAssetMap).find((ca) => {
    return item.chain === ca.originChain && item.amount?.symbol === ca.symbol;
  });

  const price = chainAsset?.priceId ? priceMap[chainAsset?.priceId] : 0;

  const balanceValue = getBalanceValue(item?.amount?.value || '0', item?.amount?.decimals || 0);
  const convertedBalanceValue = getConvertedBalanceValue(balanceValue, price);

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
          <Typography.Text className='account-name'>{item.direction === TransactionDirection.SEND ? (item.fromName || item.from || '') : (item.toName || item.to || '')}</Typography.Text>
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
          decimal={0}
          decimalOpacity={0.45}
          hide={!isShowBalance}
          suffix={item?.amount?.symbol}
          value={balanceValue.isNaN() ? '0' : balanceValue}
        />
        <Number
          className={'__meta'}
          decimal={0}
          decimalOpacity={0.45}
          hide={!isShowBalance}
          intOpacity={0.45}
          prefix={(currencyData?.isPrefix && currencyData?.symbol) || ''}
          unitOpacity={0.45}
          value={convertedBalanceValue.isNaN() ? '0' : convertedBalanceValue}
        />
      </div>

      <div className='status-tag'>
        <Tag
          className='tag'
          color={HistoryStatusMap[item.status].schema === 'danger' ? 'error' : HistoryStatusMap[item.status].schema}
        >
          {HistoryStatusMap[item.status].name}
        </Tag>

        <Button
          disabled={!link}
          icon={
            <Icon
              phosphorIcon={ArrowSquareOut}
              size='sm'
            />
          }
          onClick={handleOnClick}
          size={'xs'}
          tooltip={t('View on explorer')}
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

    '.ant-number .ant-typography': {
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

    '.__fee.-hide': {
      opacity: 0
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

      '.__account-name': {
        fontWeight: 500
      },

      '&:hover': {

      },

      '.status-wrapper': {
        flex: 1,
        paddingLeft: token.padding,
        paddingRight: token.padding,
        display: 'flex',

        '.__main-icon-wrapper': {
          marginRight: 8
        }
      },

      '.account-wrapper': {
        flex: 2,
        display: 'inline-flex',
        alignItems: 'center',
        overflow: 'hidden',

        '.account-info': {
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 8,
          overflow: 'hidden'
        },

        '.account-name': {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        },

        '.account-address': {
          color: token.colorTextLight4,
          fontSize: '12px',
          lineHeight: '20px',
          fontWeight: 500
        }
      },

      '.status-tag': {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end'
      },

      '.value-wrapper': {
        flex: 1,
        textAlign: 'right'
      }
    }
  });
});
