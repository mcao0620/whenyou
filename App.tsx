import React, {useEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import RootNavigator from './src/navigation';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import {
  useSetAuthCurrentUser,
  useNotificationsEnabled,
  useSetNotificationsEnabled,
} from './src/store/store';
import {StatusBar} from 'react-native';

function App(): JSX.Element {
  const navigatorRef = useRef(null);
  const setAuthCurrentUser = useSetAuthCurrentUser();
  const setNotificationsEnabled = useSetNotificationsEnabled();

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  useEffect(() => {
    const handleNotifications = async () => {
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      setNotificationsEnabled(enabled);
      console.log(enabled);

      if (!enabled) {
        return;
      }
    };

    handleNotifications();
  });

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
