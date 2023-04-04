import React, {useEffect, useCallback} from 'react';
import {View, TouchableOpacity, Text, ScrollView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import {
  useCurrentUserInfo,
  useAuthCurrentUser,
  useSetCurrentUserInfo,
  useCurrentGroupObjects,
  useSetCurrentGroupObjects,
  useSetCurrentGameState,
  useNotificationsEnabled,
  useSetNotificationsEnabled,
} from '../store/store';
import {
  subscribeToCurrentUserInfo,
  subscribeToCurrentGroupInfo,
} from '../api/subscribers';
import GroupHomeScreen from '../components/GroupHomeScreen';
import {GameState, GameSettings} from '../types/gameSettings';

export const getDailyTimeSeconds = (date: Date) => {
  return (
    date.getHours() * GameSettings.SECONDS_IN_HOUR +
    date.getMinutes() * GameSettings.SECONDS_IN_MIN +
    date.getSeconds()
  );
};

// takes in a date object and returns the current game state
export const getGameStateFromDate = (date: Date) => {
  const secondsSinceMidnight = getDailyTimeSeconds(date);
  if (secondsSinceMidnight < GameSettings.SUBMISSION_ENDS) {
    // in submission period
    return GameState.submit;
  } else if (secondsSinceMidnight < GameSettings.VOTING_ENDS) {
    // in voting period
    return GameState.vote;
  } else {
    // in results period
    return GameState.result;
  }
};

const HomeScreen = () => {
  const authCurrentUser = useAuthCurrentUser();
  const {currentGroupInfo: group} = useCurrentGroupObjects();
  const setCurrentGroupObjects = useSetCurrentGroupObjects();
  const currentUserInfo = useCurrentUserInfo();
  const setCurrentUserInfo = useSetCurrentUserInfo();
  const setCurrentGameState = useSetCurrentGameState();
  const setNotificationsEnabled = useSetNotificationsEnabled();

  const navigation = useNavigation<any>();

  useEffect(() => {
    const subscriber = subscribeToCurrentUserInfo(
      authCurrentUser,
      setCurrentUserInfo,
    );
    return () => {
      subscriber();
    };
  }, [authCurrentUser, setCurrentUserInfo]);

  useEffect(() => {
    if (currentUserInfo && currentUserInfo.groups.length > 0) {
      const subscriber = subscribeToCurrentGroupInfo(
        currentUserInfo,
        setCurrentGroupObjects,
      );
      return () => {
        subscriber();
      };
    }
  }, [currentUserInfo, setCurrentGroupObjects]);

  // updates current game state in global store based on time
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentGameState(getGameStateFromDate(new Date()));
    }, GameSettings.UPDATE_FREQUENCY); // check every second
    return () => clearInterval(intervalId);
  }, [setCurrentGameState]);

  const requestUserPermission = useCallback(async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    console.log('Authorization status:', authStatus);
    setNotificationsEnabled(enabled);
  }, [setNotificationsEnabled]);

  useEffect(() => {
    requestUserPermission();
  }, [requestUserPermission]);

  const welcomeText = (
    <Text className="text-lg font-bold text-black">
      {' '}
      Welcome {currentUserInfo?.firstName}
    </Text>
  );

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const handleJoinGroup = () => {
    navigation.navigate('JoinGroup');
  };

  return (
    <View className="flex-1 bg-white">
      {currentUserInfo && currentUserInfo.groups.length === 0 && (
        <>
          <ScrollView
            contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
            <View className="items-center bg-white">
              {welcomeText}
              <TouchableOpacity
                onPress={handleJoinGroup}
                className="mt-10 mb-4 h-12 w-60 items-center justify-center rounded-3xl bg-black">
                <Text className="text-md font-bold text-white">Join Group</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateGroup}
                className="mt-4 mb-40 h-12 w-60 items-center justify-center rounded-3xl bg-black">
                <Text className="text-md font-bold text-white">
                  Create Group
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      )}
      {currentUserInfo &&
        currentUserInfo.groups.length > 0 &&
        group?.groupName && (
          <GroupHomeScreen group={group} user={currentUserInfo} />
        )}
    </View>
  );
};

export default HomeScreen;
