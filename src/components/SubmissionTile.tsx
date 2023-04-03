import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import FastImage from 'react-native-fast-image';
import {Blurhash} from 'react-native-blurhash';

const SubmissionTile = ({
  submission,
  handleSubmissionUpload,
  submitted,
}: any) => {
  return submission.key ? (
    submitted ? (
      <View>
        <FastImage
          className="h-full w-full rounded-3xl"
          source={{
            uri: submission?.photoUrl,
          }}
        />
      </View>
    ) : (
      <View className="overflow-hidden rounded-3xl">
        <Blurhash
          blurhash={submission?.blurHash}
          className="h-full w-full rounded-3xl"
        />
      </View>
    )
  ) : (
    <TouchableOpacity
      className="h-full w-full items-center justify-center rounded-3xl bg-zinc-200"
      onPress={handleSubmissionUpload}>
      <Feather name="plus" size={36} color="#27272a" />
    </TouchableOpacity>
  );
};

export default SubmissionTile;
