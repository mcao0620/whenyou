import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
const StartScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-5xl font-bold">WhenYou</Text>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('EnterPhone');
        }}
        className="mt-64 h-12 w-60 items-center justify-center rounded-3xl bg-black">
        <Text className="text-md font-bold text-white">Let's Go</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StartScreen;
