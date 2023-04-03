import React from 'react';
import {View, Text} from 'react-native';
import FastImage from 'react-native-fast-image';
import FacePile from './FacePile';

const ResultsTile = ({submission, userInfo, votedBy}: any) => {
  return (
    <View>
      <View className="items-center">
        <FastImage
          className="h-full w-full rounded-3xl"
          source={{
            uri: submission.photoUrl,
          }}
        />
        <View className="absolute top-3 h-10 w-6/12 flex-row items-center rounded-full bg-white">
          <FastImage
            source={{
              uri: userInfo?.profilePicUrl,
            }}
            className="ml-1.5 h-8 w-8 rounded-full"
          />
          <View className="justify-center-center mx-1 flex-1">
            <Text
              numberOfLines={1}
              className="w-22 text-center font-semibold">{`@${userInfo?.username}`}</Text>
          </View>
        </View>
      </View>
      <View className="absolute bottom-3 left-6">
        <FacePile userObjs={votedBy} />
      </View>
    </View>
  );
};

export default ResultsTile;
