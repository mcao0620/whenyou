import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import FastImage from 'react-native-fast-image';
import AntDesign from 'react-native-vector-icons/AntDesign';

const VotingTile = ({currentUserId, submission, vote, handleVote}: any) => {
  return (
    <View>
      <FastImage
        className="h-full w-full rounded-3xl"
        source={{
          uri: submission?.photoUrl,
        }}
      />
      {submission?.key !== currentUserId && (
        <TouchableOpacity
          className="absolute bottom-2 right-2 h-8 w-8 items-center justify-center rounded-full bg-white"
          onPress={() => handleVote(submission)}>
          <AntDesign
            name={vote === submission?.key ? 'like1' : 'like2'}
            size={16}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default VotingTile;
