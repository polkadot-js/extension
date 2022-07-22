// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainRegistry, CurrentNetworkInfo, NftCollection as _NftCollection, NftItem as _NftItem, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { AccountContext } from '@subwallet/extension-koni-ui/components';
import useAccountBalance from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import useCrowdloanNetworks from '@subwallet/extension-koni-ui/hooks/screen/home/useCrowdloanNetworks';
import useFetchNft from '@subwallet/extension-koni-ui/hooks/screen/home/useFetchNft';
import useFetchStaking from '@subwallet/extension-koni-ui/hooks/screen/home/useFetchStaking';
import useGetNetworkMetadata from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkMetadata';
import useShowedNetworks from '@subwallet/extension-koni-ui/hooks/screen/home/useShowedNetworks';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { TabHeaderItemType } from '@subwallet/extension-koni-ui/Popup/Home/types';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ModalQrProps, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BN_ZERO, isAccountAll, NFT_DEFAULT_GRID_SIZE, NFT_GRID_HEIGHT_THRESHOLD, NFT_HEADER_HEIGHT, NFT_PER_ROW, NFT_PREVIEW_HEIGHT } from '@subwallet/extension-koni-ui/util';
import BigN from 'bignumber.js';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TFunction } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import buyIcon from '../../assets/buy-icon.svg';
import sendIcon from '../../assets/send-icon.svg';
import swapIcon from '../../assets/swap-icon.svg';

const Crowdloans = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Crowdloans/Crowdloans'));
const NetworkSelection = React.lazy(() => import('@subwallet/extension-koni-ui/components/NetworkSelection/NetworkSelection'));
const NftContainer = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/render/NftContainer'));
const StakingContainer = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking/StakingContainer'));
const TabHeaders = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Tabs/TabHeaders'));
const TransactionHistory = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/TransactionHistory/TransactionHistory'));
const ChainBalances = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/ChainBalances/ChainBalances'));
const ActionButton = React.lazy(() => import('./ActionButton'));
const AddAccount = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Accounts/AddAccount'));
const BalancesVisibility = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/BalancesVisibility'));
const AccountQrModal = React.lazy(() => import('@subwallet/extension-koni-ui/components/AccountQrModal'));
const Link = React.lazy(() => import('@subwallet/extension-koni-ui/components/Link'));
const Header = React.lazy(() => import('@subwallet/extension-koni-ui/partials/Header'));

interface WrapperProps extends ThemeProps {
  className?: string;
}

interface Props {
  className?: string;
  currentAccount: AccountJson;
  network: CurrentNetworkInfo;
  chainRegistryMap: Record<string, ChainRegistry>;
  historyMap: Record<string, TransactionHistoryItemType[]>;
}
const HomeNavIconWrap = ({ children }: {children: JSX.Element[] | JSX.Element}) => (<svg
  fill='none'
  height='26'
  viewBox='0 0 26 26'
  width='26'
  xmlns='http://www.w3.org/2000/svg'
>
  {children}
</svg>);

function getTabHeaderItems (address: string, t: TFunction): TabHeaderItemType[] {
  const cryptoIcon = (<HomeNavIconWrap>
    <path
      d='M13 0C10.4288 0 7.91538 0.762437 5.77754 2.1909C3.6397 3.61935 1.97346 5.64968 0.989518 8.02512C0.00557929 10.4006 -0.251864 13.0144 0.249744 15.5362C0.751352 18.0579 1.98948 20.3743 3.80756 22.1924C5.62565 24.0105 7.94203 25.2486 10.4638 25.7502C12.9855 26.2518 15.5994 25.9944 17.9748 25.0104C20.3503 24.0265 22.3806 22.3603 23.8091 20.2224C25.2375 18.0846 26 15.5712 26 13C25.996 9.55338 24.6252 6.24905 22.188 3.81192C19.7509 1.37479 16.4466 0.00390097 13 0ZM14.5 19H14V20C14 20.2652 13.8946 20.5196 13.7071 20.7071C13.5195 20.8946 13.2652 21 13 21C12.7347 21 12.4804 20.8946 12.2928 20.7071C12.1053 20.5196 12 20.2652 12 20V19H9.99995C9.73474 19 9.48038 18.8946 9.29284 18.7071C9.10531 18.5196 8.99995 18.2652 8.99995 18C8.99995 17.7348 9.10531 17.4804 9.29284 17.2929C9.48038 17.1054 9.73474 17 9.99995 17H14.5C14.8978 17 15.2793 16.842 15.5606 16.5607C15.8419 16.2794 16 15.8978 16 15.5C16 15.1022 15.8419 14.7206 15.5606 14.4393C15.2793 14.158 14.8978 14 14.5 14H11.5C10.5717 14 9.68146 13.6313 9.02508 12.9749C8.3687 12.3185 7.99995 11.4283 7.99995 10.5C7.99995 9.57174 8.3687 8.68151 9.02508 8.02513C9.68146 7.36875 10.5717 7 11.5 7H12V6C12 5.73478 12.1053 5.48043 12.2928 5.29289C12.4804 5.10536 12.7347 5 13 5C13.2652 5 13.5195 5.10536 13.7071 5.29289C13.8946 5.48043 14 5.73478 14 6V7H16C16.2652 7 16.5195 7.10536 16.7071 7.29289C16.8946 7.48043 17 7.73478 17 8C17 8.26522 16.8946 8.51957 16.7071 8.70711C16.5195 8.89464 16.2652 9 16 9H11.5C11.1021 9 10.7206 9.15804 10.4393 9.43934C10.158 9.72064 9.99995 10.1022 9.99995 10.5C9.99995 10.8978 10.158 11.2794 10.4393 11.5607C10.7206 11.842 11.1021 12 11.5 12H14.5C15.4282 12 16.3184 12.3687 16.9748 13.0251C17.6312 13.6815 18 14.5717 18 15.5C18 16.4283 17.6312 17.3185 16.9748 17.9749C16.3184 18.6313 15.4282 19 14.5 19Z'
      fill='currentColor'
    />
  </HomeNavIconWrap>);
  const crowdLoanIcon = (<HomeNavIconWrap>
    <path
      d='M6.76309 16.4916C6.36581 16.0945 6.2162 16.294 6.12783 16.3824C3.84008 18.6702 1.80906 24.1902 2.88278 23.651C6.79153 21.6884 7.44281 22.2728 9.73048 19.9852C9.81892 19.8967 10.0223 19.7509 9.61345 19.342L6.76309 16.4916Z'
      fill='currentColor'
    />
    <path
      d='M19.096 16.461C18.9923 16.131 19.2095 15.972 19.3009 15.8734C24.3502 10.422 27.5593 3.15914 25.1812 0.780916C22.8156 -1.5845 15.7767 1.7183 10.3269 6.73117C10.2191 6.83047 10.0066 7.01852 9.6264 6.93914L7.92844 6.53483C7.45701 6.42272 6.79089 6.61116 6.44822 6.95383L0.217885 13.1841C-0.124785 13.5268 -0.0134527 13.8688 0.465317 13.944L4.97152 14.6521C5.45029 14.7274 6.12235 14.5086 6.46494 14.1659C6.46494 14.1659 6.69745 13.9327 6.93105 14.1662C8.21986 15.4549 10.6148 17.8498 11.8427 19.0778C12.0867 19.3218 11.853 19.5539 11.853 19.5539C11.5102 19.8966 11.2915 20.5685 11.3668 21.0474L12.0749 25.5535C12.1501 26.0325 12.4921 26.1438 12.8347 25.801L19.0651 19.5706C19.4077 19.2279 19.5963 18.562 19.484 18.0906L19.096 16.461ZM17.7011 8.41178C16.6458 7.35651 16.6458 5.64573 17.7011 4.59061C18.7563 3.53533 20.4671 3.53533 21.5224 4.59061C22.5776 5.64565 22.5776 7.35651 21.5224 8.41171C20.4671 9.46699 18.7562 9.46699 17.7011 8.41178Z'
      fill='currentColor'
    />
  </HomeNavIconWrap>);
  const nftsIcon = (<HomeNavIconWrap>
    <path
      d='M22.8664 4.06195C23.2879 4.06195 23.6296 3.72024 23.6296 3.29874V2.26419C23.6296 1.84269 23.2879 1.50098 22.8664 1.50098C22.4519 1.50098 22.1109 1.16842 22.1038 0.750184C22.0966 0.333828 21.7571 0 21.3407 0H20.1182C19.7016 0 19.362 0.334133 19.3551 0.750693C19.3483 1.1644 19.0062 1.50098 18.5924 1.50098C18.1787 1.50098 17.8366 1.1644 17.8298 0.750693C17.8229 0.334133 17.4833 0 17.0667 0H15.8443C15.4277 0 15.088 0.334133 15.0812 0.750693C15.0743 1.1644 14.7322 1.50098 14.3185 1.50098C13.9047 1.50098 13.5626 1.1644 13.5558 0.750693C13.5489 0.334133 13.2093 0 12.7927 0H11.5703C11.1537 0 10.814 0.334133 10.8072 0.750693C10.8004 1.1644 10.4583 1.50098 10.0445 1.50098C9.63073 1.50098 9.28861 1.1644 9.28184 0.750693C9.27497 0.334133 8.93535 0 8.51873 0H7.29633C6.87972 0 6.54004 0.334133 6.53322 0.750693C6.5264 1.1644 6.18428 1.50098 5.77052 1.50098C5.35676 1.50098 5.01464 1.1644 5.00787 0.750693C5.001 0.334133 4.66137 0 4.24476 0H3.0223C2.60585 0 2.26632 0.333828 2.2592 0.750184C2.25207 1.16807 1.91143 1.50098 1.49655 1.50098C1.07505 1.50098 0.733337 1.84269 0.733337 2.26419V3.29874C0.733337 3.72024 1.07505 4.06195 1.49655 4.06195C1.91738 4.06195 2.25976 4.40433 2.25976 4.82516C2.25976 5.246 1.91738 5.58837 1.49655 5.58837C1.07505 5.58837 0.733337 5.93009 0.733337 6.35158V7.38614C0.733337 7.80763 1.07505 8.14935 1.49655 8.14935C1.91738 8.14935 2.25976 8.49172 2.25976 8.91256C2.25976 9.33339 1.91738 9.67577 1.49655 9.67577C1.07505 9.67577 0.733337 10.0175 0.733337 10.439V11.4736C0.733337 11.8951 1.07505 12.2368 1.49655 12.2368C1.91738 12.2368 2.25976 12.5792 2.25976 13C2.25976 13.4208 1.91738 13.7632 1.49655 13.7632C1.07505 13.7632 0.733337 14.1049 0.733337 14.5264V15.561C0.733337 15.9825 1.07505 16.3242 1.49655 16.3242C1.91738 16.3242 2.25976 16.6666 2.25976 17.0874C2.25976 17.5083 1.91738 17.8507 1.49655 17.8507C1.07505 17.8507 0.733337 18.1924 0.733337 18.6139V19.6484C0.733337 20.0699 1.07505 20.4116 1.49655 20.4116C1.91738 20.4116 2.25976 20.754 2.25976 21.1748C2.25976 21.5957 1.91738 21.938 1.49655 21.938C1.07505 21.938 0.733337 22.2798 0.733337 22.7013V23.7358C0.733337 24.1573 1.07505 24.499 1.49655 24.499C1.91102 24.499 2.25207 24.8316 2.2592 25.2498C2.26632 25.6662 2.6059 26 3.0223 26H4.24471C4.66132 26 5.001 25.6659 5.00782 25.2493C5.01459 24.8356 5.35671 24.499 5.77047 24.499C6.18423 24.499 6.52635 24.8356 6.53312 25.2493C6.53994 25.6659 6.87961 26 7.29623 26H8.51863C8.93524 26 9.27492 25.6659 9.28174 25.2493C9.28851 24.8356 9.63063 24.499 10.0444 24.499C10.4582 24.499 10.8003 24.8356 10.807 25.2493C10.8139 25.6659 11.1535 26 11.5701 26H12.7926C13.2092 26 13.5488 25.6659 13.5557 25.2493C13.5624 24.8356 13.9046 24.499 14.3183 24.499C14.7321 24.499 15.0742 24.8356 15.081 25.2493C15.0878 25.6659 15.4275 26 15.8441 26H17.0665C17.4831 26 17.8228 25.6659 17.8296 25.2493C17.8364 24.8356 18.1785 24.499 18.5922 24.499C19.006 24.499 19.3481 24.8356 19.3549 25.2493C19.3617 25.6659 19.7014 26 20.118 26H21.3404C21.7569 26 22.0964 25.6662 22.1035 25.2498C22.1106 24.832 22.4513 24.499 22.8662 24.499C23.2877 24.499 23.6294 24.1573 23.6294 23.7358V22.7013C23.6294 22.2798 23.2877 21.938 22.8662 21.938C22.4453 21.938 22.1029 21.5957 22.1029 21.1748C22.1029 20.754 22.4453 20.4116 22.8662 20.4116C23.2877 20.4116 23.6294 20.0699 23.6294 19.6484V18.6138C23.6294 18.1923 23.2877 17.8506 22.8662 17.8506C22.4453 17.8506 22.1029 17.5082 22.1029 17.0874C22.1029 16.6666 22.4453 16.3242 22.8662 16.3242C23.2877 16.3242 23.6294 15.9825 23.6294 15.561V14.5264C23.6294 14.1049 23.2877 13.7632 22.8662 13.7632C22.4453 13.7632 22.1029 13.4208 22.1029 13C22.1029 12.5792 22.4453 12.2368 22.8662 12.2368C23.2877 12.2368 23.6294 11.8951 23.6294 11.4736V10.439C23.6294 10.0175 23.2877 9.67582 22.8662 9.67582C22.4453 9.67582 22.1029 9.33344 22.1029 8.91261C22.1029 8.49177 22.4453 8.1494 22.8662 8.1494C23.2877 8.1494 23.6294 7.80768 23.6294 7.38619V6.35163C23.6294 5.93014 23.2877 5.58842 22.8662 5.58842C22.4453 5.58842 22.1029 5.24605 22.1029 4.82521C22.1029 4.40438 22.4456 4.06195 22.8664 4.06195V4.06195ZM19.8136 21.3953C19.8136 21.8168 19.4719 22.1585 19.0504 22.1585H5.31259C4.8911 22.1585 4.54938 21.8168 4.54938 21.3953V4.6047C4.54938 4.1832 4.8911 3.84149 5.31259 3.84149H19.0504C19.4719 3.84149 19.8136 4.1832 19.8136 4.6047V21.3953Z'
      fill='currentColor'
    />
    <path
      d='M11.2527 15.2744V13.8678C10.4986 13.7158 9.8105 13.338 9.26521 12.7671C8.54117 12.009 8.16904 11.0133 8.21734 9.96349C8.26075 9.02027 8.65548 8.12993 9.32889 7.45657C10.0023 6.78316 10.8926 6.38843 11.8359 6.34501C12.8854 6.29662 13.8813 6.6688 14.6394 7.39284C15.3979 8.11718 15.8156 9.09355 15.8156 10.142V15.5477C16.4827 15.1707 17.2277 14.9161 18.0201 14.8153V10.4623C18.0201 7.3318 15.3176 4.78491 11.9958 4.78491C8.67396 4.78491 5.97144 7.33175 5.97144 10.4623V15.5644C6.3591 15.3796 6.79876 15.2744 7.26494 15.2744H11.2527Z'
      fill='currentColor'
    />
    <path
      d='M8.76251 16.7979H7.26472C6.5515 16.7979 5.97122 17.2748 5.97122 17.861V21.2149H12.7237V20.833C12.7237 20.5152 12.7483 20.2031 12.7957 19.8984H12.5489C10.68 19.8984 9.11722 18.5639 8.76251 16.7979V16.7979Z'
      fill='currentColor'
    />
    <path
      d='M14.2921 10.142C14.2921 9.51366 14.0418 8.92861 13.5872 8.49448C13.133 8.06071 12.5354 7.83773 11.9059 7.86678C10.7443 7.92025 9.79265 8.87194 9.73917 10.0335C9.71018 10.6635 9.93311 11.2606 10.3669 11.7148C10.801 12.1694 11.3861 12.4197 12.0144 12.4197C12.4351 12.4197 12.7761 12.7607 12.7761 13.1814V16.0361C12.7761 16.4568 12.4351 16.7978 12.0144 16.7978H10.3375C10.6542 17.7147 11.5259 18.3749 12.549 18.3749H13.2446C13.5079 17.7832 13.863 17.2411 14.2921 16.7669V10.142H14.2921Z'
      fill='currentColor'
    />
    <path
      d='M14.2471 20.8329V21.2149H18.0283V16.3539C15.8846 16.7172 14.2471 18.5874 14.2471 20.8329Z'
      fill='currentColor'
    />
  </HomeNavIconWrap>);
  const stakingIcon = (<HomeNavIconWrap>
    <path
      d='M24.7 1.3H20.8V0H5.2V1.3H1.3C0.52 1.3 0 1.82 0 2.6V5.72C0 8.71 2.21 11.18 5.2 11.57V11.7C5.2 15.47 7.8 18.59 11.31 19.37L10.4 22.1H7.41C6.89 22.1 6.37 22.49 6.24 23.01L5.2 26H20.8L19.76 23.01C19.63 22.49 19.11 22.1 18.59 22.1H15.6L14.69 19.37C18.2 18.59 20.8 15.47 20.8 11.7V11.57C23.79 11.18 26 8.71 26 5.72V2.6C26 1.82 25.48 1.3 24.7 1.3ZM5.2 8.97C3.77 8.58 2.6 7.28 2.6 5.72V3.9H5.2V8.97ZM15.6 13L13 11.57L10.4 13L11.05 10.4L9.1 7.8H11.83L13 5.2L14.17 7.8H16.9L14.95 10.4L15.6 13ZM23.4 5.72C23.4 7.28 22.23 8.71 20.8 8.97V3.9H23.4V5.72Z'
      fill='currentColor'
    />
  </HomeNavIconWrap>);
  const trasferIcon = (<HomeNavIconWrap>
    <path
      d='M23.9621 12.9147C23.9621 12.744 24.0307 12.347 24.6646 12.347C24.6646 12.347 25.288 12.347 25.7486 12.347C26.2174 12.347 25.8869 11.9541 25.8869 11.9541L22.9314 7.29173C22.9215 7.28051 22.7715 7.10166 22.6259 7.31743L19.7059 11.9357C19.7059 11.9357 19.3396 12.347 19.8419 12.347C20.3056 12.347 20.9384 12.347 20.9384 12.347C21.2649 12.347 21.6398 12.426 21.6398 13.0429C21.6398 18.3452 17.3069 22.659 11.9813 22.659C6.65514 22.659 2.32193 18.326 2.32193 12.9999C2.32193 7.67394 6.65514 3.34081 11.9813 3.34081C13.405 3.34081 14.7757 3.64312 16.0552 4.23919C16.2104 4.31155 16.3752 4.34811 16.5446 4.34811C16.9946 4.34811 17.4082 4.08478 17.5982 3.67716C17.8683 3.09683 17.6163 2.40469 17.0361 2.13435C15.4472 1.39422 13.7465 1.0188 11.9813 1.0188C5.37485 1.0188 0 6.3935 0 12.9999C0 19.6065 5.37485 24.9812 11.9813 24.9812C18.5615 24.9812 23.9361 19.6278 23.9617 13.0475C23.9615 13.0472 23.9621 12.9478 23.9621 12.9147Z'
      fill='currentColor'
    />
    <path
      d='M12.5956 13.6022C12.4384 13.6022 12.3099 13.4737 12.3099 13.3165V8.46893C12.3099 8.31172 12.1812 8.18323 12.0242 8.18323H10.9485C10.7913 8.18323 10.6628 8.31172 10.6628 8.46893L10.6624 14.9638C10.6624 15.1209 10.7911 15.2494 10.9481 15.2494H17.3126C17.4698 15.2494 17.5984 15.1209 17.5984 14.9638V13.8879C17.5984 13.7307 17.4698 13.6022 17.3126 13.6022H12.5956V13.6022Z'
      fill='currentColor'
    />
  </HomeNavIconWrap>);

  const result = [
    {
      tabId: 1,
      label: t('Crypto'),
      icon: cryptoIcon
    },
    {
      tabId: 2,
      label: t('NFTs'),
      icon: crowdLoanIcon
    },
    {
      tabId: 3,
      label: t('Crowdloans'),
      icon: nftsIcon
    },
    {
      tabId: 4,
      label: t('Staking'),
      icon: stakingIcon
    }
  ];

  if (!isAccountAll(address)) {
    result.push({
      tabId: 5,
      label: t('Transfers'),
      icon: trasferIcon
    });
  }

  return result;
}

function Wrapper ({ className, theme }: WrapperProps): React.ReactElement {
  const { hierarchy } = useContext(AccountContext);
  const { chainRegistry: chainRegistryMap,
    currentAccount: { account: currentAccount },
    currentNetwork,
    transactionHistory: { historyMap } } = useSelector((state: RootState) => state);

  if (!hierarchy.length) {
    return (<AddAccount />);
  }

  if (!currentAccount || !currentNetwork.isReady) {
    return (<></>);
  }

  return (
    <Home
      chainRegistryMap={chainRegistryMap}
      className={className}
      currentAccount={currentAccount}
      historyMap={historyMap}
      network={currentNetwork}
    />
  );
}

function Home ({ chainRegistryMap, className = '', currentAccount, historyMap, network }: Props): React.ReactElement {
  const { networkKey } = network;
  const { address } = currentAccount;

  const { t } = useTranslation();

  const [isShowBalanceDetail, setShowBalanceDetail] = useState<boolean>(false);
  const backupTabId = window.localStorage.getItem('homeActiveTab') || '1';
  const [activatedTab, setActivatedTab] = useState<number>(Number(backupTabId));
  const _setActiveTab = useCallback((tabId: number) => {
    window.localStorage.setItem('homeActiveTab', `${tabId}`);
    setActivatedTab(tabId);
    setShowBalanceDetail(false);
  }, []);
  const [isShowZeroBalances, setShowZeroBalances] = useState<boolean>(
    window.localStorage.getItem('show_zero_balances') === '1'
  );
  const [isQrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [selectedNetworkBalance, setSelectedNetworkBalance] = useState<BigN>(BN_ZERO);
  const [modalQrProp, setModalQrProp] = useState<ModalQrProps>({
    network: {
      networkKey: networkKey
    },
    account: {
      address: currentAccount.address
    },
    showExportButton: true
  });

  const { accounts } = useContext(AccountContext);
  const networkMetadataMap = useGetNetworkMetadata();
  const showedNetworks = useShowedNetworks(networkKey, address, accounts);
  const crowdloanNetworks = useCrowdloanNetworks(networkKey);

  const [nftPage, setNftPage] = useState(1);

  const [chosenNftCollection, setChosenNftCollection] = useState<_NftCollection>();
  const [showNftCollectionDetail, setShowNftCollectionDetail] = useState<boolean>(false);

  const [chosenNftItem, setChosenNftItem] = useState<_NftItem>();
  const [showNftItemDetail, setShowNftItemDetail] = useState<boolean>(false);

  const [showTransferredCollection, setShowTransferredCollection] = useState(false);
  const [showForcedCollection, setShowForcedCollection] = useState(false);

  const isSetNetwork = window.localStorage.getItem('isSetNetwork') !== 'ok';
  const [showNetworkSelection, setShowNetworkSelection] = useState(isSetNetwork);

  const updateModalQr = useCallback((newValue: Partial<ModalQrProps>) => {
    setModalQrProp((oldValue) => {
      return {
        ...oldValue,
        ...newValue
      };
    });
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem('isSetNetwork') === 'ok' && showNetworkSelection) {
      setShowNetworkSelection(false);
    }
  }, [networkMetadataMap, showNetworkSelection]);

  const parseNftGridSize = useCallback(() => {
    if (window.innerHeight > NFT_GRID_HEIGHT_THRESHOLD) {
      const nftContainerHeight = window.innerHeight - NFT_HEADER_HEIGHT;
      const rowCount = Math.floor(nftContainerHeight / NFT_PREVIEW_HEIGHT);

      return rowCount * NFT_PER_ROW;
    } else {
      return NFT_DEFAULT_GRID_SIZE;
    }
  }, []);
  const nftGridSize = parseNftGridSize();
  const { loading: loadingNft, nftList, totalCollection, totalItems } = useFetchNft(nftPage, networkKey, nftGridSize);
  const { data: stakingData, loading: loadingStaking, priceMap: stakingPriceMap } = useFetchStaking(networkKey);

  const handleNftPage = useCallback((page: number) => {
    setNftPage(page);
  }, []);

  useEffect(() => {
    if (isAccountAll(address) && activatedTab === 5) {
      _setActiveTab(1);
    }
  }, [address, activatedTab, _setActiveTab]);

  const { crowdloanContributeMap,
    networkBalanceMaps,
    totalBalanceValue } = useAccountBalance(networkKey, showedNetworks, crowdloanNetworks);

  const _toggleZeroBalances = useCallback(() => {
    setShowZeroBalances((v) => {
      window.localStorage.setItem('show_zero_balances', v ? '0' : '1');

      return !v;
    });
  }, []);

  const _showQrModal = useCallback(() => {
    setModalQrProp({
      network: {
        networkKey: networkKey
      },
      account: {
        address: currentAccount.address
      },
      showExportButton: true
    });

    setQrModalOpen(true);
  }, [currentAccount, networkKey]);

  const _closeQrModal = useCallback(() => {
    setModalQrProp({
      network: {
        networkKey: networkKey
      },
      account: {
        address: currentAccount.address
      },
      showExportButton: false
    });

    setQrModalOpen(false);
  }, [networkKey, currentAccount.address]);

  const tabItems = useMemo<TabHeaderItemType[]>(() => {
    return getTabHeaderItems(address, t);
  }, [address, t]);

  const onChangeAccount = useCallback((address: string) => {
    setShowBalanceDetail(false);
  }, []);

  return (
    <div className={`home-screen home ${className}`}>
      <Header
        changeAccountCallback={onChangeAccount}
        className={'home-header'}
        isContainDetailHeader={true}
        isShowZeroBalances={isShowZeroBalances}
        setShowBalanceDetail={setShowBalanceDetail}
        showAdd
        showSearch
        showSettings
        text={t<string>('Accounts')}
        toggleZeroBalances={_toggleZeroBalances}
      />

      <div className={'home-action-block'}>
        <div className='account-total-balance'>
          <BalancesVisibility
            isShowBalanceDetail={isShowBalanceDetail}
            selectedNetworkBalance={selectedNetworkBalance}
            totalBalanceValue={totalBalanceValue}
          />
        </div>

        <div className='home-account-button-container'>
          <div className='action-button-wrapper'>
            <ActionButton
              iconSrc={buyIcon}
              onClick={_showQrModal}
              tooltipContent={t<string>('Receive')}
            />
          </div>
          <Link
            className={'action-button-wrapper'}
            to={'/account/send-fund'}
          >
            <ActionButton
              iconSrc={sendIcon}
              tooltipContent={t<string>('Send')}
            />
          </Link>

          <Link
            className={'action-button-wrapper'}
            to={'/account/xcm-transfer'}
          >
            <ActionButton
              iconSrc={swapIcon}
              tooltipContent={t<string>('XCM Transfer')}
            />
          </Link>

          {/* <Link */}
          {/*  className={'action-button-wrapper'} */}
          {/*  to={'/account/donate'} */}
          {/* > */}
          {/*  <ActionButton */}
          {/*    iconSrc={donateIcon} */}
          {/*    tooltipContent={t<string>('Donate')} */}
          {/*  /> */}
          {/* </Link> */}
        </div>
      </div>

      <div className={'home-tab-contents'}>
        {activatedTab === 1 && (
          <ChainBalances
            address={address}
            currentNetworkKey={networkKey}
            isShowBalanceDetail={isShowBalanceDetail}
            isShowZeroBalances={isShowZeroBalances}
            networkBalanceMaps={networkBalanceMaps}
            networkKeys={showedNetworks}
            networkMetadataMap={networkMetadataMap}
            setQrModalOpen={setQrModalOpen}
            setSelectedNetworkBalance={setSelectedNetworkBalance}
            setShowBalanceDetail={setShowBalanceDetail}
            updateModalQr={updateModalQr}
          />
        )}

        {activatedTab === 2 && (
          <NftContainer
            chosenCollection={chosenNftCollection}
            chosenItem={chosenNftItem}
            currentNetwork={networkKey}
            loading={loadingNft}
            nftGridSize={nftGridSize}
            nftList={nftList}
            page={nftPage}
            setChosenCollection={setChosenNftCollection}
            setChosenItem={setChosenNftItem}
            setPage={handleNftPage}
            setShowCollectionDetail={setShowNftCollectionDetail}
            setShowForcedCollection={setShowForcedCollection}
            setShowItemDetail={setShowNftItemDetail}
            setShowTransferredCollection={setShowTransferredCollection}
            showCollectionDetail={showNftCollectionDetail}
            showForcedCollection={showForcedCollection}
            showItemDetail={showNftItemDetail}
            showTransferredCollection={showTransferredCollection}
            totalCollection={totalCollection}
            totalItems={totalItems}
          />
        )}

        {activatedTab === 3 && (
          <Crowdloans
            crowdloanContributeMap={crowdloanContributeMap}
            networkKeys={crowdloanNetworks}
            networkMetadataMap={networkMetadataMap}
          />
        )}

        {activatedTab === 4 && (
          <StakingContainer
            data={stakingData}
            loading={loadingStaking}
            priceMap={stakingPriceMap}
          />
        )}

        {activatedTab === 5 && (
          <TransactionHistory
            historyMap={historyMap}
            networkKey={networkKey}
            registryMap={chainRegistryMap}
          />
        )}
      </div>

      <TabHeaders
        activatedItem={activatedTab}
        className={'home-tab-headers'}
        items={tabItems}
        onSelectItem={_setActiveTab}
      />

      {isQrModalOpen && (
        <AccountQrModal
          className='home__account-qr-modal'
          closeModal={_closeQrModal}
          modalQrProp={modalQrProp}
          updateModalQr={updateModalQr}
        />
      )}

      {
        showNetworkSelection && <NetworkSelection
          handleShow={setShowNetworkSelection}
        />
      }
    </div>
  );
}

export default React.memo(styled(Wrapper)(({ theme }: WrapperProps) => `
  display: flex;
  flex-direction: column;
  height: 100%;

  .home-tab-contents {
    flex: 1;
    overflow: auto;
  }

  .home-action-block {
    display: flex;
    padding: 20px 25px;
  }

  .account-total-balance {
    flex: 1;
    font-weight: 500;
    font-size: 32px;
    line-height: 44px;
  }

  .account-total-btn {
    width: fit-content;
    cursor: pointer;
  }

  .home-account-button-container {
    display: flex;
  }

  .action-button-wrapper {
    opacity: 1;
    margin-right: 10px;
  }

  .action-button-wrapper:last-child {
    margin-right: 0;
  }

  .home__account-qr-modal .subwallet-modal {
    max-width: 460px;
  }
`));
