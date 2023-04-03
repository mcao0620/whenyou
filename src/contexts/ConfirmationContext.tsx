import {createContext} from 'react';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';

export const ConfirmationContext = createContext({
  confirmation: {} as FirebaseAuthTypes.ConfirmationResult,
  setConfirmation: (a: any) => {
    var b = a;
    a = b;
  },
});
