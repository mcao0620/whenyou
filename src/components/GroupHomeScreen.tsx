import React, {useEffect, useState} from 'react';
import {View, TouchableOpacity, Text, Dimensions} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useNavigation} from '@react-navigation/native';
import SubmissionFeed from '../components/SubmissionFeed';
import storage from '@react-native-firebase/storage';
import {useCurrentGameState} from '../store/store';
import VotingFeed from './VotingFeed';
import {GameState} from '../types/gameSettings';
import ResultsFeed from './ResultsFeed';

const GroupHomeScreen = ({group, user}: any) => {
  const navigation = useNavigation<any>();
  const currentGameState = useCurrentGameState();
  const [prompt, setPrompt] = useState('');

  // This will be replaced by query for the image submissions
  // const imageSubmissions = [];

  useEffect(() => {
    // get the current day of the year (ex: feb 1st is 32nd day of the year)
    const getCurrDayOfYear = (date: Date) => {
      const dayOfYear =
        (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
          Date.UTC(date.getFullYear(), 0, 0)) /
        24 /
        60 /
        60 /
        1000;
      return dayOfYear;
    };

    // fetch prompts text file from firebase storage
    const fetchData = async () => {
      const url = await storage().ref('whenyou-prompts.txt').getDownloadURL();
      return url;
    };

    // load prompts text file
    fetchData().then(url => {
      const request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.send(null);
      request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
          const type = request.getResponseHeader('Content-Type');
          if (type?.indexOf('text') !== 1) {
            // extract prompts and filter
            const rawPromptLines = request.responseText as string;
            const promptList = rawPromptLines
              .split('\n')
              .filter(p => p.length > 0);

            // set current prompt as function of current date
            const dailyPrompt =
              promptList[getCurrDayOfYear(new Date()) % promptList.length];
            setPrompt(dailyPrompt);
          }
        }
      };
    });
  }, [currentGameState]); // re-render prompt whenever game state changes

  const handleGroupScreen = () => {
    navigation.navigate('GroupScreen');
  };

  return (
    <>
      <View className="mt-3 ml-3 mb-1 flex-row items-center">
        <TouchableOpacity onPress={handleGroupScreen}>
          <View className="flex-row items-center">
            <FastImage
              source={{uri: group?.groupPicUrl}}
              className="mr-2 h-10 w-10 rounded-full"
            />
            <Text
              className="text-3xl font-semibold"
              numberOfLines={1}
              style={{maxWidth: Dimensions.get('screen').width - 90}}>
              {group.groupName}
            </Text>
            <Text className="ml-2 text-lg text-zinc-400">{'>'}</Text>
          </View>
        </TouchableOpacity>
        <View className="w-auto flex-1" />
      </View>
      <View className="my-3 mx-3 rounded-2xl bg-zinc-200 px-3 py-3">
        <View className="flex-row flex-wrap">
          <Text>
            <Text className="font-bold">Today's prompt: </Text>
            <Text>{prompt}</Text>
          </Text>
        </View>
      </View>
      {currentGameState === GameState.submit ? (
        <SubmissionFeed prompt={prompt} user={user} />
      ) : currentGameState === GameState.vote ? (
        <VotingFeed user={user} />
      ) : (
        <ResultsFeed user={user} />
      )}
    </>
  );
};

export default GroupHomeScreen;
