import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Contract = {
    id: string;
    name: string;
};

type ContractsState = {
    items: Contract[];
};

const initialState: ContractsState = {
    items: [],
};

const contractsSlice = createSlice({
    name: 'contracts',
    initialState,
    reducers: {
        addContract(state, action: PayloadAction<Contract>) {
            state.items.push(action.payload);
        },
    }
});

export const { addContract } = contractsSlice.actions;
export default contractsSlice.reducer;