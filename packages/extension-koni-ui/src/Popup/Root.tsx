// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Button } from '@subwallet/react-ui';
import Bowser from 'bowser';
import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';

export function initRootPromise () {
  // Init Application with some default data if not existed
  const VARIANTS = ['beam', 'marble', 'pixel', 'sunset', 'bauhaus', 'ring'];

  function getRandomVariant (): string {
    const random = Math.floor(Math.random() * 6);

    return VARIANTS[random];
  }

  const browser = Bowser.getParser(window.navigator.userAgent);

  if (!window.localStorage.getItem('randomVariant') || !window.localStorage.getItem('randomNameForLogo')) {
    const randomVariant = getRandomVariant();

    window.localStorage.setItem('randomVariant', randomVariant);
    window.localStorage.setItem('randomNameForLogo', `${Date.now()}`);
  }

  if (!!browser.getBrowser() && !!browser.getBrowser().name && !!browser.getOS().name) {
    window.localStorage.setItem('browserInfo', browser.getBrowser().name as string);
    window.localStorage.setItem('osInfo', browser.getOS().name as string);
  }

  // Todo: Fetching data and setup store here
  // Todo: Loading all basic data for root with promise.all()
  // Todo: Settings data
  // Todo: Accounts data
  return true;
}

interface MenuProps {
  className?: string,
  isShow: boolean,
}
const _Menu = ({ className }: MenuProps) => (
  <ul className={className}>
    <li><Link to='/welcome'>Welcome</Link></li>
    <li>
      <Link to='/home'>Home</Link>
      <ul>
        <li><Link to='/home/crypto'>Crypto</Link></li>
        <li><Link to='/home/nft'>NFT</Link></li>
        <li><Link to='/home/crowdloan'>Crowdloan</Link></li>
        <li><Link to='/home/staking'>Staking</Link></li>
        <li><Link to='/home/histories'>Histories</Link></li>
      </ul>
    </li>
    <li>
      <Link to='/transaction'>Transaction</Link>
      <ul>
        <li><Link to='/transaction/send-fund'>Send Fund</Link></li>
        <li><Link to='/transaction/send-nft'>Send NFT</Link></li>
        <li><Link to='/transaction/stake'>Stake</Link></li>
        <li><Link to='/transaction/unstake'>Unstake</Link></li>
        <li><Link to='/transaction/withdraw'>Withdraw</Link></li>
        <li><Link to='/transaction/claim-reward'>Claim Reward</Link></li>
        <li><Link to='/transaction/compound'>Compound</Link></li>
      </ul>
    </li>
    <li>
      <Link to='/account'>Account</Link>
      <ul>
        <li><Link to='/account/account-list'>Account List</Link></li>
        <li>
          <Link to='/account/add-account'>Add Account</Link>
          <ul>
            <li><Link to='/account/add-account/from-seed'>From Seed</Link></li>
            <li><Link to='/account/add-account/derive'>Derive</Link></li>
            <li><Link to='/account/add-account/from-json'>From JSON</Link></li>
            <li><Link to='/account/add-account/attach-readonly'>Attach Readonly</Link></li>
            <li><Link to='/account/add-account/attach-qr'>Attach QR</Link></li>
            <li><Link to='/account/add-account/attach-ledger'>Attach Ledger</Link></li>
          </ul>
        </li>
        <li>
          <Link to='/account/account-detail/:accountId'>Account Detail</Link>
          <ul>
            <li><Link to='/account/account-detail/:accountId/export'>Export</Link></li>
          </ul>
        </li>
      </ul>
    </li>
    <li>
      <Link to='/setting'>Setting</Link>
      <ul>
        <li><Link to='/setting/list'>List</Link></li>
        <li><Link to='/setting/general'>General</Link></li>
        <li><Link to='/setting/dapp-access'>DApp Access</Link></li>
        <li><Link to='/setting/dapp-access-edit'>DApp Access Edit</Link></li>
        <li><Link to='/setting/network'>Networks</Link></li>
        <li><Link to='/setting/network-edit'>Network Edit</Link></li>
        <li><Link to='/setting/token'>Token</Link></li>
        <li><Link to='/setting/master-password'>Master Password</Link></li>
      </ul>
    </li>
  </ul>);

const Menu = styled(_Menu)<MenuProps>(({isShow}) => {
  return {
    backgroundColor: '#333',
    paddingTop: '16px',
    paddingBottom: '16px',
    paddingRight: '16px',
    position: 'fixed',
    top: 0,
    margin: 0,
    height: '100%',
    width: '200px',
    left: isShow ? 0 : '-100%',
    overflow: 'auto',
    transitionDuration: '0.3s',

    '&, ul': {
      paddingLeft: 16
    },

    li: {
      listStyle: 'none'
    },

    a: {
      color: '#fff'
    }
  };
});

const TmpHeader = styled.div(() => ({
  display: 'flex',
  padding: 16,

  '.left-item': {
    flex: '1 1 200px'
  }
}));

export default function Root (): React.ReactElement {
  const location = useLocation();

  // Todo: Navigate to default page
  useEffect(() => {
    // Todo: Redirect to default page depend on condition
  }, []);

  // Todo: Remove these code in the future
  const [isShowMenu, setIsShowMenu] = useState<boolean>(false);

  function toggleMenu () {
    setIsShowMenu((current) => !current);
  }

  useEffect(() => {
    console.log(location.pathname);
    setIsShowMenu(false);
  }, [location.pathname]);

  return (
    <div style={{ color: '#fff' }}>
      <div>
        <TmpHeader>
          <div className={'left-item'}>
            <div><b>Current path:</b> {location.pathname} </div>
            <div><b>Current state:</b> {JSON.stringify(location.state)}</div>
          </div>
          <div className={'right-item'}>
            <Button
              onClick={toggleMenu}
              size={'sm'}
            >Menu</Button>
          </div>
          <div className={'main-menu'}>
            <Menu isShow={isShowMenu} />
          </div>
        </TmpHeader>
      </div>
      <Outlet />
    </div>
  );
}
