// // Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// // SPDX-License-Identifier: Apache-2.0
//
// import { ExtrinsicType, NominatorMetadata } from '@subwallet/extension-base/background/KoniTypes';
// import { MetaInfo } from '@subwallet/extension-koni-ui/components';
// import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
// import useGetNativeTokenBasicInfo from '@subwallet/extension-koni-ui/hooks/common/useGetNativeTokenBasicInfo';
// import { StakingDataOption } from '@subwallet/extension-koni-ui/Popup/Home/Staking/MoreActionModal';
// import FreeBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalance';
// import TransactionContent from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionContent';
// import TransactionFooter from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionFooter';
// import { TransactionContext, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
// import { RootState } from '@subwallet/extension-koni-ui/stores';
// import { ThemeProps } from '@subwallet/extension-koni-ui/types';
// import { isAccountAll } from '@subwallet/extension-koni-ui/util';
// import { Button, Form, Icon } from '@subwallet/react-ui';
// import { ArrowCircleRight, XCircle } from 'phosphor-react';
// import React, { useCallback, useContext, useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import { useSelector } from 'react-redux';
// import { useLocation } from 'react-router-dom';
// import styled from 'styled-components';
// import {AccountJson} from "@subwallet/extension-base/background/types";
//
// type Props = ThemeProps
//
// interface StakeWithdrawProps extends TransactionFormBaseProps {
//   token: string
//   value: string
// }
//
// const Component: React.FC<Props> = (props: Props) => {
//   const { className = '' } = props;
//   const transactionContext = useContext(TransactionContext);
//   const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
//   const isAll = isAccountAll(currentAccount?.address || '');
//
//   const location = useLocation();
//   const [locationState] = useState<StakingDataOption>(location?.state as StakingDataOption);
//   const [nominatorMetadata] = useState(locationState?.nominatorMetadata as NominatorMetadata);
//
//   const [form] = Form.useForm<StakeWithdrawProps>();
//   const formDefault = {
//     from: transactionContext.from,
//     value: '0'
//   };
//
//   const { decimals, symbol } = useGetNativeTokenBasicInfo(nominatorMetadata.chain);
//
//   useEffect(() => {
//     transactionContext.setTransactionType(ExtrinsicType.STAKING_WITHDRAW);
//     transactionContext.setChain(nominatorMetadata.chain);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [transactionContext]);
//
//   const onFieldsChange = useCallback(({ from }: Partial<StakeWithdrawProps>, values: StakeWithdrawProps) => {
//     // TODO: field change
//   }, []);
//
//   const { t } = useTranslation();
//
//   const submitTransaction = useCallback(() => {
//     // TODO: submit transaction
//   }, []);
//
//   const withdrawableValidators = useCallback(() => {
//     const result: AccountJson[] = [];
//
//     nominatorMetadata.
//
//     return result;
//   }, []);
//
//   return (
//     <>
//       <TransactionContent>
//         <Form
//           className={`${className} form-container form-space-sm`}
//           form={form}
//           initialValues={formDefault}
//           onValuesChange={onFieldsChange}
//         >
//           {isAll &&
//             <Form.Item name={'from'}>
//               <AccountSelector
//               />
//             </Form.Item>
//           }
//
//           <FreeBalance
//             className={'free-balance'}
//             label={t('Transferable:')}
//           />
//
//           <MetaInfo
//             className={'meta-info'}
//             hasBackgroundWrapper
//           >
//             <MetaInfo.Chain
//               chain={nominatorMetadata.chain}
//               label={t('Network')}
//             />
//
//             <MetaInfo.Number
//               decimals={decimals}
//               label={t('Withdrawal amount')}
//               suffix={symbol}
//               value={'9000000000'}
//             />
//           </MetaInfo>
//         </Form>
//       </TransactionContent>
//       <TransactionFooter
//         errors={[]}
//         warnings={[]}
//       >
//         <Button
//           icon={<Icon
//             phosphorIcon={XCircle}
//             weight={'fill'}
//           />}
//           loading={false}
//           onClick={submitTransaction}
//           schema={'secondary'}
//         >
//           {t('Cancel')}
//         </Button>
//
//         <Button
//           icon={<Icon
//             phosphorIcon={ArrowCircleRight}
//             weight={'fill'}
//           />}
//           loading={false}
//           onClick={submitTransaction}
//         >
//           {t('Submit')}
//         </Button>
//       </TransactionFooter>
//     </>
//   );
// };
//
// const WithdrawStake = styled(Component)<Props>(({ theme: { token } }: Props) => {
//   return {
//     '.free-balance': {
//       marginBottom: token.marginXS
//     },
//
//     '.meta-info': {
//       marginBottom: token.marginSM
//     }
//   };
// });
//
// export default WithdrawStake;
