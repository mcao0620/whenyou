import React, {useEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import RootNavigator from './src/navigation';
import auth from '@react-native-firebase/auth';
import {useSetAuthCurrentUser} from './src/store/store';
import {StatusBar} from 'react-native';

function App(): JSX.Element {
  const navigatorRef = useRef(null);
  const setAuthCurrentUser = useSetAuthCurrentUser();

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (user: any) => {
      if (navigatorRef.current) {
        if (user?.displayName) {
          setAuthCurrentUser(user);
        } else {
          setAuthCurrentUser(null);
        }
      }
    });
    return subscriber;
  }, [setAuthCurrentUser]);

  return (
    <NavigationContainer ref={navigatorRef}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default App;
