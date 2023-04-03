import React from 'react';
import {View} from 'react-native';
import FastImage from 'react-native-fast-image';

const FacePile = ({userObjs}: any) => {
  return (
    <View className="flex-row">
      {userObjs.map((userObj: any, idx: any) => (
        <FastImage
          className="-ml-3 h-10 w-10 items-center justify-center rounded-full border-2 border-green-200"
          key={idx}
          source={{
            uri: userObj?.profilePicUrl,
          }}
        />
      ))}
    </View>
  );
};

export default FacePile;
