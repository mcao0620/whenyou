import React from 'react';
import auth from '@react-native-firebase/auth';
import {View, Text, TouchableOpacity} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useCurrentUserInfo, useAuthCurrentUser} from '../store/store';
import EditUser from '../components/EditUser';

const ProfileScreen = () => {
  const currentUserInfo = useCurrentUserInfo();
  const uid = useAuthCurrentUser().uid;

  return (
    <>
      <View className="flex-1 items-center bg-white">
        <FastImage
          className="mt-24 h-36 w-36 rounded-full"
          source={{uri: currentUserInfo?.profilePicUrl}}
        />
        <Text className="my-4 text-lg font-bold">
          {currentUserInfo?.username &&
            currentUserInfo.firstName +
              ' ' +
              currentUserInfo.lastName +
              ' (' +
              currentUserInfo.username +
              ')'}
        </Text>
        <EditUser
          userid={uid}
          photo={currentUserInfo?.profilePicUrl}
          firstName={currentUserInfo?.firstName}
          lastName={currentUserInfo?.lastName}
        />
        <TouchableOpacity
          onPress={() => {
            auth().signOut();
          }}
          className="mt-16 h-12 w-60 items-center justify-center rounded-3xl bg-black">
          <Text className="text-md font-bold text-white">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default ProfileScreen;
