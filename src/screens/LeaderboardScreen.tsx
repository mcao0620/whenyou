import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {
  useAuthCurrentUser,
  useCurrentGameState,
  useCurrentGroupObjects,
  useCurrentUserInfo,
} from '../store/store';
import firestore from '@react-native-firebase/firestore';
import {GameState} from '../types/gameSettings';

const calculateRankings = (data: any, rankings: number[]) => {
  // let currRank = 1;
  for (let i = 1; i <= data.length; i++) {
    if (
      data[i] &&
      data[i - 1] &&
      data[i].numGamesWon === data[i - 1].numGamesWon &&
      data[i].totalPoints === data[i - 1].totalPoints
    ) {
      rankings[i] = rankings[i - 1];
    } else {
      rankings[i] = i + 1;
    }
  }
};

const LeaderboardHeader = ({sortedData, user}: any) => {
  const rankings = Array(sortedData.length).fill(1);
  calculateRankings(sortedData, rankings);

  const userIdx = sortedData
    .map((x: any) => {
      return x.username;
    })
    .indexOf(user.username);

  const ranking = rankings[userIdx];
  const userPoints = sortedData[userIdx] ? sortedData[userIdx].totalPoints : 0;

  // converts integers to ordinal suffix (ex: 1->1st, 2->2nd, 3->3rd, etc...)
  const getOrdinalSuffixOf = (i: number) => {
    const j = i % 10;
    const k = i % 100;
    if (j === 1 && k !== 11) {
      return i + 'st';
    }
    if (j === 2 && k !== 12) {
      return i + 'nd';
    }
    if (j === 3 && k !== 13) {
      return i + 'rd';
    }
    return i + 'th';
  };

  return (
    <>
      <View className="mx-5 mb-5 mt-8 flex-row items-center justify-center">
        <View className="flex-1 items-center justify-center">
          <Text className="text-4xl font-semibold text-blue-800">
            {' '}
            {getOrdinalSuffixOf(ranking)}{' '}
          </Text>
        </View>
        <FastImage
          source={{uri: user.profilePicUrl}}
          className="h-24 w-24 rounded-full"
        />
        <View className="flex-1 items-center justify-center">
          <Text className="text-3xl font-semibold text-red-800">
            {' '}
            {userPoints}pts
          </Text>
        </View>
      </View>
    </>
  );
};

const GroupStats = ({sortedData, user, refreshing, loadDataFunction}: any) => {
  const rankings = Array(sortedData.length).fill(1);
  calculateRankings(sortedData, rankings);

  return (
    <>
      <View className="mx-2 flex-row items-center justify-between bg-white">
        <Text className="my-2 ml-11 text-lg font-semibold">User</Text>
        <View className="flex-row items-center">
          <Text className="my-2 mr-5 text-lg font-semibold">Wins</Text>
          <Text className="my-2 mr-1 text-lg font-semibold">Points</Text>
        </View>
      </View>
      <FlatList
        data={sortedData}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadDataFunction}
          />
        }
        renderItem={({item, index}) => (
          <View
            className={`my-1 mx-2 flex-row items-center justify-between rounded-xl py-2.5 pl-1 ${
              // highlight the current user
              item.username === user.username ? 'bg-blue-300' : 'bg-gray-300'
            }`}>
            <View className="w-10 items-center justify-center">
              <Text className="text-2xl font-semibold">{rankings[index]}</Text>
            </View>
            <View className="w-10 items-center justify-center">
              <FastImage
                source={{uri: item.profilePicUrl}}
                className="h-10 w-10 rounded-full"
              />
            </View>
            <Text className="ml-2 flex-1 text-lg" numberOfLines={1}>
              {item.username}
            </Text>
            <View className="w-32 flex-row items-center">
              <View className="flex-1 items-center">
                <Text className="text-2xl font-semibold text-blue-900">
                  {item.numGamesWon}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl text-red-900">
                  {item.totalPoints}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    </>
  );
};

const Leaderboard = ({currentGroupInfo, currentUserInfo}: any) => {
  interface UserLeaderboardInfo {
    uid: string;
    username: string;
    profilePicUrl: string;
    totalPoints: number;
    numGamesWon: number;
  }

  interface UserStats {
    numGamesWon: number;
    totalPoints: number;
  }

  const currentGameState = useCurrentGameState();
  const {currentGroupUserInfos} = useCurrentGroupObjects();
  const authCurrentUserUID = useAuthCurrentUser()?.uid;

  const initialLeaderboard = Array.from(currentGroupUserInfos.keys()).map(
    (uid: any) => {
      return {
        uid: uid,
        username: currentGroupUserInfos.get(uid)?.username,
        profilePicUrl: currentGroupUserInfos.get(uid)?.profilePicUrl,
        totalPoints: 0,
        numGamesWon: 0,
      } as UserLeaderboardInfo;
    },
  );

  const [leaderboardStats, setLeaderboardStats] =
    useState<UserLeaderboardInfo[]>(initialLeaderboard);
  const [refreshing, setRefreshing] = useState(true);
  const [showLoading, setShowLoading] = useState(true);

  const loadLeaderboardData = useCallback(() => {
    // given a map of uid to the number of votes, returns a list of winners for that day
    const getWinners = (dailyStats: Map<string, number>) => {
      return Array.from(dailyStats.keys()).filter(uid => {
        return (
          dailyStats.get(uid) ===
            Math.max.apply(null, Array.from(dailyStats.values())) &&
          dailyStats.get(uid) !== 0
        );
      });
    };

    // from submission data, gets a list of all dates to consider in leaderboard
    const getDatesFromSubmissions = (
      submissionData: any,
      startIdx: number = 0,
    ) => {
      let dates = submissionData.data()?.dates;
      if (!dates || dates.length === 0) {
        return [];
      }

      dates = dates.slice(startIdx);
      if (currentGameState !== GameState.result) {
        // game still in progress, do not include submissions from today
        const today = new Date();
        const dateString = `${
          today.getMonth() + 1
        }-${today.getDate()}-${today.getFullYear()}`;
        if (dates.at(-1) === dateString) {
          dates.pop();
        }
      }
      return dates;
    };

    // format data into sorted array for leaderboard
    const formatData = (overallStats: any) => {
      const formattedData = Array.from(overallStats.keys()).map((uid: any) => {
        return {
          uid: uid,
          username: currentGroupUserInfos.get(uid)?.username,
          profilePicUrl: currentGroupUserInfos.get(uid)?.profilePicUrl,
          totalPoints: overallStats.get(uid).totalPoints,
          numGamesWon: overallStats.get(uid).numGamesWon,
        } as UserLeaderboardInfo;
      });
      return formattedData
        .sort((a, b) => {
          if (a.numGamesWon < b.numGamesWon) {
            return -1;
          } else if (a.numGamesWon > b.numGamesWon) {
            return 1;
          } else {
            // tie break on number of points
            if (a.totalPoints < b.totalPoints) {
              return -1;
            } else if (a.totalPoints > b.totalPoints) {
              return 1;
            } else {
              return 0;
            }
          }
        })
        .reverse();
    };

    const getDataInRange = async (
      groupRef: any,
      users: string[],
      dates: string[],
    ) => {
      const overallStats = new Map<string, UserStats>(
        users.map((uid: string) => [
          uid,
          {
            totalPoints: 0,
            numGamesWon: 0,
          },
        ]),
      );
      for (let i = 0; i < dates.length; i++) {
        const dailyStats = new Map<string, number>();
        for (let u = 0; u < users.length; u++) {
          const uid = users[u];
          const doc = await groupRef.collection(dates[i]).doc(uid).get();

          let numVotes = 0;
          if (doc.exists && doc) {
            numVotes = doc.data()?.votes.length;
          }
          dailyStats.set(uid, numVotes);
          overallStats.get(uid)!.totalPoints += numVotes;
        }
        const dailyWinners = getWinners(dailyStats);
        for (const winner of dailyWinners) {
          overallStats.get(winner)!.numGamesWon++;
        }
      }
      return overallStats;
    };

    // pull cached group stats from backend, fetch relevant new stats, and combine
    const getCachedStats = async (
      groupStatsDoc: any,
      groupStatsData: any,
      groupRef: any,
      submissionData: any,
      currentUsers: string[],
    ) => {
      // get cached stats
      const oldStats = groupStatsData?.data()?.stats;
      const lastUpdatedIdx = groupStatsData?.data()?.lastUpdatedIdx;

      // get updated stats
      const datesToFetch = getDatesFromSubmissions(
        submissionData,
        lastUpdatedIdx,
      );
      const updatedStats = await getDataInRange(
        groupRef,
        currentUsers,
        datesToFetch,
      );

      // combine old + new stats - keep track of all users that have ever joined the group in the cache, in case they join back
      for (const user of Object.keys(oldStats)) {
        if (updatedStats.has(user)) {
          const combined = {
            numGamesWon:
              oldStats[user].numGamesWon + updatedStats.get(user)?.numGamesWon,
            totalPoints:
              oldStats[user].totalPoints + updatedStats.get(user)?.totalPoints,
          };
          updatedStats.set(user, combined);
        } else {
          updatedStats.set(user, oldStats[user]);
        }
      }

      // update cache in database
      await groupStatsDoc.set(
        {
          stats: Object.fromEntries(updatedStats),
          lastUpdatedIdx: lastUpdatedIdx + datesToFetch.length,
        },
        {merge: true},
      );

      // only display data for current users
      return new Map(
        [...updatedStats].filter(userData =>
          currentUsers.includes(userData[0]),
        ),
      );
    };

    const fetchData = async () => {
      if (
        currentGroupInfo &&
        currentGroupInfo.gid !== '' &&
        currentGroupInfo.users
      ) {
        // fetch submission data object
        const groupRef = firestore()
          .collection('Submissions-Group')
          .doc(currentGroupInfo?.gid);
        const submissionData = await groupRef.get();
        const currentUsers = currentGroupInfo?.users;

        // fetch group stats cache (if if exists)
        const groupStatsDoc = firestore()
          .collection('Group-Stats')
          .doc(currentGroupInfo?.gid);
        const groupStatsData = await groupStatsDoc.get();

        let overallStats = new Map<string, UserStats>();
        if (groupStatsData.exists) {
          // cache exists, fetch new data and combine with existing
          overallStats = await getCachedStats(
            groupStatsDoc,
            groupStatsData,
            groupRef,
            submissionData,
            currentUsers,
          );
        } else {
          // no cache exists, fetch all data and store in cache
          const allDates = getDatesFromSubmissions(submissionData);
          overallStats = await getDataInRange(groupRef, currentUsers, allDates);
          await groupStatsDoc.set(
            {
              stats: Object.fromEntries(overallStats),
              lastUpdatedIdx: allDates.length,
            },
            {merge: true},
          );
        }

        if (overallStats && overallStats.size > 0) {
          setLeaderboardStats(formatData(overallStats));
        } else {
          // check needed in case user leaves a group
          setLeaderboardStats(initialLeaderboard);
        }

        setRefreshing(false);
      }
    };

    fetchData().catch(console.error);
    setShowLoading(false);
  }, [
    currentGroupInfo,
    currentGameState,
    currentGroupUserInfos,
    initialLeaderboard,
  ]);

  useEffect(() => {
    loadLeaderboardData();
  }, [loadLeaderboardData]);

  useEffect(() => {
    setShowLoading(true);
  }, []);

  return (
    <View className="flex-1 bg-white">
      {/* Show loading icon while data is fetching, or user is not in the current leaderboard data*/}
      {showLoading ||
      leaderboardStats.filter(obj => obj.uid === authCurrentUserUID).length ===
        0 ? (
        <ActivityIndicator size="large" className="absolute inset-2/4 z-10" />
      ) : (
        <>
          <LeaderboardHeader
            sortedData={leaderboardStats}
            user={currentUserInfo}
          />
          <GroupStats
            sortedData={leaderboardStats}
            user={currentUserInfo}
            refreshing={refreshing}
            loadDataFunction={loadLeaderboardData}
          />
        </>
      )}
    </View>
  );
};

const LeaderboardScreen = () => {
  const {currentGroupInfo} = useCurrentGroupObjects();
  const currentUserInfo = useCurrentUserInfo();
  return currentUserInfo && currentUserInfo.groups.length > 0 ? (
    // user in a group, show the full leaderboard
    <Leaderboard
      currentUserInfo={currentUserInfo}
      currentGroupInfo={currentGroupInfo}
    />
  ) : (
    // user not in group, prompt them to join one
    <>
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg font-bold">
          Please join a group to see leaderboard!
        </Text>
      </View>
    </>
  );
};

export default LeaderboardScreen;
