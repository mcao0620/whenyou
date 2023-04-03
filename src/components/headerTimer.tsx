import React, {useEffect, useState} from 'react';
import {CountdownCircleTimer} from 'react-native-countdown-circle-timer';
import {View, Text} from 'react-native';
import {useCurrentGameState} from '../store/store';
import {getDailyTimeSeconds} from '../screens/HomeScreen';
import {GameState, GameSettings} from '../types/gameSettings';

const HeaderTimer = () => {
  const [timeRemaining, setTimeRemaining] = useState(Number.MAX_SAFE_INTEGER);
  const currGameState = useCurrentGameState();

  useEffect(() => {
    // re-runs anytime current game state changes
    const timeSeconds = getDailyTimeSeconds(new Date());
    const newTimeRemaining =
      currGameState === GameState.submit
        ? GameSettings.SUBMISSION_ENDS - timeSeconds
        : currGameState === GameState.vote
        ? GameSettings.VOTING_ENDS - timeSeconds
        : GameSettings.GAME_ENDS - timeSeconds;
    setTimeRemaining(newTimeRemaining);
  }, [currGameState]);

  const colorConstant =
    currGameState === GameState.submit
      ? GameSettings.SUBMISSION_ENDS
      : currGameState === GameState.vote
      ? GameSettings.VOTING_ENDS - GameSettings.SUBMISSION_ENDS
      : GameSettings.GAME_ENDS - GameSettings.VOTING_ENDS;

  return (
    <View className="w-60 items-center justify-center">
      <View className="absoute bottom-12">
        <CountdownCircleTimer
          key={timeRemaining} // needed to update duration
          isPlaying={true}
          size={116}
          strokeWidth={0}
          duration={timeRemaining}
          colors={['#004777', '#F7B801', '#A30000', '#A30000']}
          colorsTime={[
            colorConstant,
            (colorConstant * 3) / 20,
            (colorConstant * 1) / 20,
            0,
          ]}
          onComplete={() => ({shouldRepeat: false})}
          updateInterval={1}>
          {({remainingTime, color}) => (
            <Text style={{color, fontSize: 14}}>
              {('0' + Math.floor(remainingTime / 3600)).slice(-2)}:
              {('0' + (Math.floor(remainingTime / 60) % 60)).slice(-2)}:
              {('0' + (remainingTime % 60)).slice(-2)}
            </Text>
          )}
        </CountdownCircleTimer>
      </View>
      <View className="absolute bottom-20">
        {currGameState === GameState.submit ? (
          <Text className="text-[11px]">Submission Phase</Text>
        ) : currGameState === GameState.vote ? (
          <Text className="text-[11px]">Voting Phase</Text>
        ) : (
          <Text className="text-[11px]">Results</Text>
        )}
      </View>
    </View>
  );
};

export default HeaderTimer;
