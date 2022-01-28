import {StakingJson} from "@polkadot/extension-base/background/KoniTypes";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState = {
  ready: false,
  details: []
} as StakingJson;

const stakingSlice = createSlice({
  initialState,
  name: 'staking',
  reducers: {
    update (state, action: PayloadAction<StakingJson>) {
      const payload = action.payload;

      state.details = payload.details;
      state.ready = true;
    }
  }
});

export const { update } = stakingSlice.actions;
export default stakingSlice.reducer;
