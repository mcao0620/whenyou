import React, {useCallback, useEffect, useState} from 'react';
import {Text, View, FlatList, RefreshControl} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {SubmissionGroup} from '../types/types';
import {useAuthCurrentUser, useCurrentGroupObjects} from '../store/store';
import VotingTile from './VotingTile';

const VotingFeed = ({user}: any) => {
  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionGroup[]>([]);
  const authCurrentUser = useAuthCurrentUser();
  const {currentGroupInfo} = useCurrentGroupObjects();
  const [vote, setVote] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    const today = new Date();
    const gid = user.groups[0];
    const submissionsCollection = await firestore()
      .collection('Submissions-Group')
      .doc(gid)
      .collection(
        `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`,
      )
      .get();
    const submissionObjs = [] as SubmissionGroup[];

    let userVote = null;

    submissionsCollection.forEach((doc: any) => {
      if (currentGroupInfo?.users.includes(doc.id)) {
        const submissionObj = {
          ...doc.data(),
          key: doc.id,
        } as SubmissionGroup;
        if (
          authCurrentUser?.uid &&
          submissionObj.votes.includes(authCurrentUser.uid)
        ) {
          userVote = submissionObj.key;
        }
        submissionObjs.push(submissionObj);
      }
    });
    setVote(userVote);
    setSubmissions(submissionObjs);
  }, [user, authCurrentUser, currentGroupInfo]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleVote = async (submission: any) => {
    const today = new Date();

    if (vote && vote !== submission.key) {
      await firestore()
        .collection('Submissions-Group')
        .doc(currentGroupInfo?.gid)
        .collection(
          `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`,
        )
        .doc(vote)
        .update({
          votes: firestore.FieldValue.arrayRemove(authCurrentUser?.uid),
        });
    }

    const updateOperation =
      vote === submission.key
        ? firestore.FieldValue.arrayRemove
        : firestore.FieldValue.arrayUnion;

    await firestore()
      .collection('Submissions-Group')
      .doc(currentGroupInfo?.gid)
      .collection(
        `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`,
      )
      .doc(submission.key)
      .update({
        votes: updateOperation(authCurrentUser?.uid),
      });

    await fetchFeed();
  };

  return (
    <View className="flex-1 px-1.5 py-1.5">
      {submissions.length === 0 ? (
        <View className="flex-1 items-center justify-center bg-white">
          <Text className="text-xl font-bold">
            {' '}
            No submissions this round!{' '}
          </Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          numColumns={2}
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
            <View className="h-60 w-1/2 p-1.5">
              <VotingTile
                vote={vote}
                handleVote={handleVote}
                submission={item.item}
                currentUserId={authCurrentUser?.uid}
              />
            </View>
          )}
        />
      )}
    </View>
  );
};

export default VotingFeed;
