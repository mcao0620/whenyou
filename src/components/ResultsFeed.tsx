import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Dimensions, RefreshControl} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {SubmissionGroup} from '../types/types';
import {useCurrentGroupObjects} from '../store/store';
import ResultsTile from './ResultsTile';

const ResultsFeed = ({user}: any) => {
  const [winners, setWinners] = useState<SubmissionGroup[]>([]);
  const {currentGroupInfo, currentGroupUserInfos} = useCurrentGroupObjects();
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    const today = new Date();
    const gid = user.groups[0];
    //let userSubmitted = false;
    const submissionsCollection = await firestore()
      .collection('Submissions-Group')
      .doc(gid)
      .collection(
        `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`,
      )
      .get();
    const submissionObjs = [] as SubmissionGroup[];

    let maxVotes = 0;

    submissionsCollection.forEach(doc => {
      // if (doc.id === authCurrentUser?.uid) {
      //   userSubmitted = true;
      // }
      if (currentGroupInfo?.users.includes(doc.id)) {
        const submissionObj = {
          ...doc.data(),
          key: doc.id,
        } as SubmissionGroup;
        if (submissionObj.votes.length > maxVotes) {
          maxVotes = submissionObj.votes.length;
        }
        submissionObjs.push(submissionObj);
      }
    });
    setWinners(
      submissionObjs.filter(
        sub => sub.votes.length === maxVotes && sub.votes.length > 0,
      ),
    );
  }, [user, currentGroupInfo]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <>
      <View className="items-center">
        <Text className="text-xl font-bold">
          {winners.length === 0
            ? 'No winner today :('
            : winners.length > 1
            ? "Today's winners are..."
            : "Today's winner is..."}
        </Text>
      </View>
      <View className="flex-1 px-1.5 py-1.5">
        <FlatList
          data={winners}
          horizontal={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchFeed();
                setRefreshing(false);
              }}
            />
          }
          renderItem={item => (
            <View
              className="mb-2 w-full p-1.5"
              style={{height: (7 * Dimensions.get('screen').height) / 12}}>
              <ResultsTile
                submission={item.item}
                userInfo={currentGroupUserInfos.get(item.item.key)}
                votedBy={item.item.votes.map(uid =>
                  currentGroupUserInfos.get(uid),
                )}
              />
            </View>
          )}
        />
      </View>
    </>
  );
};

export default ResultsFeed;
