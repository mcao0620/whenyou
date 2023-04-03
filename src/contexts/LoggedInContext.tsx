import {createContext} from 'react';

export const LoggedInContext = createContext({
  isLoggedIn: false,
  setIsLoggedIn: (a: any) => {
    var b = a;
    a = b;
  },
});
