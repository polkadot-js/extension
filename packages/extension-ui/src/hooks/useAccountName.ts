import { useContext } from "react";

import { AccountContext } from "../components";

const useAccountName = (selectedAddress: string) => {
  const { accounts } = useContext(AccountContext);

  return accounts.find(({ address }) => address === selectedAddress)?.name;
};

export default useAccountName;
