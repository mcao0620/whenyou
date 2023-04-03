import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicon from 'react-native-vector-icons/Ionicons';
import CreateAccountScreen from '../screens/login/CreateAccountScreen';
import StartScreen from '../screens/login/StartScreen';
import HomeScreen from '../screens/HomeScreen';
import FindGroupScreen from '../screens/groups/FindGroupScreen';
import MyGroupScreen from '../screens/groups/MyGroupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import JoinGroupScreen from '../screens/groups/JoinGroupScreen';
import EnterPhoneScreen from '../screens/login/EnterPhoneScreen';
import VerifyPhoneScreen from '../screens/login/VerifyPhoneScreen';
import GroupScreen from '../screens/groups/GroupScreen';
import {useAuthCurrentUser, useCurrentUserInfo} from '../store/store';
import HeaderTimer from '../components/headerTimer';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const LeaderboardStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const HomeStackScreen = () => {
  const currentUserInfo = useCurrentUserInfo();

  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle:
            currentUserInfo && currentUserInfo?.groups.length > 0
              ? () => <HeaderTimer />
              : 'Home',
        }}
      />
    </HomeStack.Navigator>
  );
};

const LeaderboardStackScreen = () => (
  <LeaderboardStack.Navigator>
    <LeaderboardStack.Screen name="Leaderboard" component={LeaderboardScreen} />
  </LeaderboardStack.Navigator>
);

const ProfileStackScreen = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

const TabNavigator = () => {
  return (
    <Tab.Navigator screenOptions={{tabBarShowLabel: false}}>
      <Tab.Screen
        name="HomeStack"
        component={HomeStackScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({focused}) =>
            focused ? (
              <Ionicon name="home" size={24} />
            ) : (
              <Ionicon name="home-outline" size={24} />
            ),
        }}
      />
      <Tab.Screen
        name="LeaderboardStack"
        component={LeaderboardStackScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({focused}) =>
            focused ? (
              <Ionicon name="ios-trophy" size={24} />
            ) : (
              <Ionicon name="ios-trophy-outline" size={24} />
            ),
        }}
      />
      <Tab.Screen
        name="ProfileStack"
        component={ProfileStackScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({focused}) =>
            focused ? (
              <Ionicon name="person" size={24} />
            ) : (
              <Ionicon name="person-outline" size={24} />
            ),
        }}
      />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  const authCurentUser = useAuthCurrentUser();
  return (
    <Stack.Navigator>
      {!authCurentUser ? (
        <>
          <Stack.Screen
            name="Start"
            component={StartScreen}
            options={{header: () => null}}
          />
          <Stack.Screen
            name="EnterPhone"
            component={EnterPhoneScreen}
            options={{
              title: '',
              headerShadowVisible: false,
              headerTintColor: 'black',
            }}
          />
          <Stack.Screen
            name="VerifyPhone"
            component={VerifyPhoneScreen}
            options={{
              title: '',
              headerShadowVisible: false,
              headerTintColor: 'black',
            }}
          />
          <Stack.Screen
            name="CreateAccount"
            component={CreateAccountScreen}
            options={{
              title: "Let's get started!",
              headerShadowVisible: false,
              headerTintColor: 'black',
              headerLeft: () => null,
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={TabNavigator}
            options={{header: () => null}}
          />
          <Stack.Screen
            name="FindGroup"
            component={FindGroupScreen}
            options={{title: 'Find A Group'}}
          />
          <Stack.Screen
            name="CreateGroup"
            component={CreateGroupScreen}
            options={{title: 'Create a Group'}}
          />
          <Stack.Screen
            name="MyGroup"
            component={MyGroupScreen}
            options={{title: 'My Groups'}}
          />
          {/* This screen seeks to replace the above mygroup screen */}
          <Stack.Screen
            name="GroupScreen"
            component={GroupScreen}
            options={{title: 'Group'}}
          />
          <Stack.Screen
            name="JoinGroup"
            component={JoinGroupScreen}
            options={{title: 'Join Group'}}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
