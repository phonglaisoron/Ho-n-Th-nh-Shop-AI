import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';

export const reduxStore = configureStore({
  reducer: { cartRedux: cartReducer },
});

export type ReduxRootState = ReturnType<typeof reduxStore.getState>;
export type ReduxAppDispatch = typeof reduxStore.dispatch;
