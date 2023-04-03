import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {Overlay} from 'react-native-elements';
import {SelectList} from 'react-native-dropdown-select-list';
import SwitchSelector from 'react-native-switch-selector';
import {
  useSetCurrentGroupInfo,
  useAuthCurrentUser,
  useSetCurrentGroupUserRequests,
  useSetCurrentGroupUserInfos,
  useCurrentUserInfo,
  useCurrentGroupObjects,
  useSetCurrentGroupObjects,
} from '../../store/store';
import Ionicon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import {User, Group} from '../../types/types';
import {useNavigation} from '@react-navigation/native';
import FindMembers from '../../components/GroupFindMembers';
import {SubmissionGroup} from '../../types/types';
import EditGroup from '../../components/GroupEditGroup';
import {WIDTH_CONST} from '../../types/globalConstants';

const GroupScreen = () => {
  const {currentGroupInfo: group} = useCurrentGroupObjects();
  const uid = useAuthCurrentUser().uid;

  return (
    group && (
      <View className="flex-1 bg-white">
        <View className="items-center">
          <GroupHeader />
        </View>
        <View className="items-center">
          {uid === group.owner ? (
            <GroupAdminSwitch />
          ) : (
            <View className={`${WIDTH_CONST}`}>
              <GroupMembers />
            </View>
          )}
        </View>
      </View>
    )
  );
};

const GroupHeader = () => {
  const navigation = useNavigation<any>();
  const {currentGroupInfo: group, currentGroupUserInfos: groupUsers} =
    useCurrentGroupObjects();
  const uid = useAuthCurrentUser().uid;
  const currentUserInfo = useCurrentUserInfo();
  const setCurrentGroupObjects = useSetCurrentGroupObjects();
  const isGroupAdmin = uid === group?.owner;

  // Handles selection of new group leader if group owner is leaving group
  let selected = '';
  const [visible, setVisible] = useState(false);
  const toggleOverlay = () => {
    selected = '';
    setVisible(!visible);
  };

  // Returns user to home screen upon leaving group
  const handleHome = () => {
    setCurrentGroupObjects({
      currentGroupInfo: null,
      currentGroupUserInfos: new Map<string, User>(),
      currentGroupUserRequests: new Map<string, User>(),
    });
    navigation.navigate('Home');
  };

  // Leave a group
  const leaveGroup = (owner: boolean) => {
    const groupUsersIndex = group?.users.indexOf(uid);
    const userGroupsIndex = group
      ? currentUserInfo?.groups.indexOf(group.gid)
      : -1;

    // remove user's votes
    const removeUserVote = async () => {
      const today = new Date();

      const submissionsCollection = await firestore()
        .collection('Submissions-Group')
        .doc(group?.gid)
        .collection(
          `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`,
        )
        .get();

      let userVote = null;

      submissionsCollection.forEach((doc: any) => {
        if (group?.users.includes(doc.id)) {
          const submissionObj = {
            ...doc.data(),
            key: doc.id,
          } as SubmissionGroup;
          if (uid && submissionObj.votes.includes(uid)) {
            userVote = submissionObj.key;
          }
        }
      });

      if (userVote) {
        await firestore()
          .collection('Submissions-Group')
          .doc(group?.gid)
          .collection(
            `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`,
          )
          .doc(userVote)
          .update({
            votes: firestore.FieldValue.arrayRemove(uid),
          });
      }
    };
    removeUserVote();

    if (groupUsersIndex > -1 && userGroupsIndex > -1) {
      group.users.splice(groupUsersIndex, 1);
      currentUserInfo.groups.splice(userGroupsIndex, 1);

      const batch = firestore().batch();
      const groupDocRef = firestore().collection('Groups').doc(group.gid);
      const userDocRef = firestore().collection('Users').doc(uid);

      if (owner) {
        if (group && 'requests' in group && group.requests.length > 0) {
          // owner is leaving group, make first requested member the new owner
          const acceptNewOwner = async (user_id: string, group_id: string) => {
            await firestore()
              .collection('Users')
              .doc(user_id)
              .update({
                groups: firestore.FieldValue.arrayUnion(group_id),
                requests: [],
              });

            // add user to group object and mark as owner
            await groupDocRef.update({
              owner: user_id,
              users: firestore.FieldValue.arrayUnion(user_id),
              requests: firestore.FieldValue.arrayRemove(user_id),
            });
          };
          acceptNewOwner(group.requests[0], group.gid);
        }

        batch.update(groupDocRef, {users: group.users, owner: selected});
      } else {
        batch.update(groupDocRef, {users: group.users});
      }
      batch.update(userDocRef, {groups: currentUserInfo.groups});
      batch.commit().then(() => handleHome());
    }
  };

  const leaveGroupAlert = () => {
    Alert.alert('Confirm Leave', 'Are you sure you want to leave the Group?', [
      {
        text: 'Cancel',
      },
      {
        text: 'Leave',
        onPress: () => {
          if (uid === group?.owner) {
            if (group.users.length === 1) {
              leaveGroup(true);
            } else {
              toggleOverlay();
            }
          } else {
            leaveGroup(false);
          }
        },
      },
    ]);
  };

  return (
    <View className={`mt-4 ${WIDTH_CONST} rounded-lg bg-gray-200`}>
      <View className="flex-row items-center justify-between">
        <View className="ml-4">
          <FastImage
            source={{uri: group?.groupPicUrl}}
            className="mt-2 mb-16 ml-2 h-16 w-16 rounded-full"
          />
        </View>
        <View className="absolute bottom-3">
          {isGroupAdmin && (
            <EditGroup
              groupid={group?.gid}
              photo={group?.groupPicUrl}
              name={group?.groupName}
              description={group?.description}
            />
          )}
        </View>
        <View className="w-2/3 p-4">
          <Text className="text-2xl font-bold">{group?.groupName}</Text>
          <Text className="text-gray-700">{group?.description}</Text>
          <Text className="font-bold text-gray-700">{`Code: ${group?.gid}`}</Text>
          <View className="flex-row justify-end">
            <TouchableOpacity className="mt-2">
              <Ionicon
                name="exit-outline"
                size={18}
                color="red"
                onPress={leaveGroupAlert}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Overlay isVisible={visible} onBackdropPress={toggleOverlay}>
        <View className="m-2 max-h-64">
          <Text className="mb-3 text-xl font-bold">
            Select a new Group Leader
          </Text>
          <ScrollView className="h-40">
            <SelectList
              setSelected={(val: string) => (selected = val)}
              save="key"
              data={[...groupUsers]
                .map(([userID, user]) => ({
                  key: userID,
                  value:
                    user.firstName +
                    ' ' +
                    user.lastName +
                    ' (' +
                    user.username +
                    ')',
                }))
                .filter(obj => obj.key !== uid)}
            />
          </ScrollView>
          <View className="items-center">
            <TouchableOpacity
              onPress={() => {
                if (selected !== '') {
                  leaveGroup(true);
                }
              }}
              className="mt-3 mb-2 h-6 w-28 items-center justify-center rounded-3xl bg-red-600">
              <Text className="flex-column items-middle text-base text-white">
                Leave Group
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Overlay>
    </View>
  );
};

const GroupMembers = () => {
  const {currentGroupInfo: group, currentGroupUserInfos: groupUsers} =
    useCurrentGroupObjects();
  const uid = useAuthCurrentUser().uid;
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);

  useEffect(() => {
    setIsGroupAdmin(group?.owner === uid);
  }, [group, uid]);

  const removeMemberAlert = (val: any) => {
    const name = val.user.firstName;
    Alert.alert(
      'Confirm Removing Member',
      `Are you sure you want kick ${name} out of the group?`,
      [
        {
          text: 'Cancel',
        },
        {
          text: 'Remove',
          onPress: () => {
            handleGroupAdminRemoveMember(val);
          },
        },
      ],
    );
  };

  // Remove user from group and remove group from user
  const handleGroupAdminRemoveMember = (val: any) => {
    const batch = firestore().batch();
    const memberID = val.userID;
    const groupDocRef = firestore().collection('Groups').doc(group.gid);
    const userDocRef = firestore().collection('Users').doc(memberID);
    batch.update(groupDocRef, {
      users: firestore.FieldValue.arrayRemove(memberID),
    });
    batch.update(userDocRef, {
      groups: firestore.FieldValue.arrayRemove(group.gid),
    });
    batch.commit().then((res: any) => console.log(res));
  };

  return (
    <View>
      <Text className="mt-8 text-xl font-bold">Group Members</Text>
      <FlatList
        data={[...groupUsers].map(([userID, user]) => ({userID, user}))}
        renderItem={({item}) => (
          <View className="flex-row items-center">
            {item.user.profilePicUrl && (
              <FastImage
                className="mb-2 h-8 w-8 rounded-full"
                source={{uri: item.user.profilePicUrl}}
              />
            )}
            <Text
              className="mb-2 ml-2 text-lg"
              numberOfLines={1}
              style={{maxWidth: Dimensions.get('screen').width - 120}}>
              {item.user.username &&
                item.user.firstName +
                  ' ' +
                  item.user.lastName +
                  ' (' +
                  item.user.username +
                  ')'}
            </Text>
            {isGroupAdmin && uid !== item.userID && (
              <View className="mb-2 ml-auto mr-2">
                <Ionicon
                  name="close-outline"
                  size={16}
                  onPress={() => removeMemberAlert(item)}
                />
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
};

const GroupAdminSwitch = () => {
  const [isMembers, setIsMembers] = useState(true);
  const options = [
    {
      label: 'Members',
      value: 1,
      testID: 'switch-members',
      accessibilityLabel: 'toggle-members-view',
    },
    {
      label: 'Requests',
      value: 0,
      testID: 'switch-requests',
      accessibilityLabel: 'toggle-requests-to-join-group',
    },
  ];

  return (
    <View className={`${WIDTH_CONST}`}>
      <SwitchSelector
        className="mt-4 mr-12"
        options={options}
        initial={isMembers ? 0 : 1}
        onPress={(value: any) => {
          setIsMembers(value);
        }}
        backgroundColor="#d6d6d6"
        buttonColor="#7a807e"
        // tailwind WIDTH_CONST (w-72) evaluates to width: 91.666667%;
        style={{width: WIDTH_CONST ? '100%' : '0'}}
      />
      <FindMembers />
      {isMembers ? <GroupMembers /> : <Requests />}
    </View>
  );
};

const Requests = () => {
  const {currentGroupInfo: group, currentGroupUserRequests: requestUsers} =
    useCurrentGroupObjects();
  const setGroup = useSetCurrentGroupInfo();
  const setRequestUsers = useSetCurrentGroupUserRequests();
  let setCurrentGroupUserInfos = useSetCurrentGroupUserInfos();

  const updateBackend = async (val: any, isAccept: boolean) => {
    const {user, userID: uid} = val;
    // Find index of gid in user requests array and splice it out if found
    const gid = group.gid;
    const idx = user.requests.indexOf(gid);
    if (idx > -1) {
      user.requests.splice(idx, 1);
    }
    if (isAccept) {
      const groups = [gid];

      await firestore()
        .collection('Users')
        .doc(uid)
        .update({requests: user.requests, groups: groups});
    } else {
      await firestore()
        .collection('Users')
        .doc(uid)
        .update({requests: user.requests});
    }

    // Remove this user from group requests array
    const u_idx = group.requests.indexOf(uid);
    if (u_idx > -1) {
      group.requests.splice(u_idx, 1);
    }
    if (isAccept) {
      group.users.push(uid);
      await firestore()
        .collection('Groups')
        .doc(gid)
        .update({requests: group.requests, users: group.users});
    } else {
      await firestore()
        .collection('Groups')
        .doc(gid)
        .update({requests: group.requests});
    }
    setGroup(group as Group);

    // Update requestUsers state
    const groupInfo = await firestore().collection('Groups').doc(gid).get();
    const groupUserRequestsInfo = new Map<string, User>();
    groupInfo.data()?.requests.forEach(async (userId: string) => {
      const groupUserRequestInfo = await firestore()
        .collection('Users')
        .doc(userId)
        .get();
      groupUserRequestsInfo.set(userId, groupUserRequestInfo.data() as User);
    });
    setRequestUsers(groupUserRequestsInfo);

    // if accepted a user, need to update groupUsers hook
    if (isAccept) {
      const groupUserInfos = new Map<string, User>();
      groupInfo.data()?.users.forEach(async (userId: string) => {
        const groupUserInfo = await firestore()
          .collection('Users')
          .doc(userId)
          .get();
        groupUserInfos.set(userId, groupUserInfo.data() as User);
      });
      setCurrentGroupUserInfos(groupUserInfos);
    }
  };

  const handleAccept = async (val: any) => {
    // Remove request from the Group and User fields
    // and add user to the correct group field in both User and Group
    await updateBackend(val, true);
  };

  const handleDeny = async (val: any) => {
    // Remove request from the Group and User fields
    await updateBackend(val, false);
  };

  return (
    group && (
      <View>
        {requestUsers.size === 0 ? (
          <Text className="mt-8 text-lg font-bold">
            There are no pending join requests!
          </Text>
        ) : (
          <View className="w-full">
            <Text className="mt-8 text-xl font-bold">Requests</Text>
            <FlatList
              data={[...requestUsers].map(([userID, user]) => ({userID, user}))}
              renderItem={({item}) => (
                <View className="flex-row items-center">
                  {item.user.profilePicUrl && (
                    <FastImage
                      className="mb-2 h-8 w-8 rounded-full"
                      source={{uri: item.user.profilePicUrl}}
                    />
                  )}
                  <Text
                    className="mb-2 ml-2 text-lg"
                    numberOfLines={1}
                    style={{maxWidth: Dimensions.get('screen').width - 140}}>
                    {item.user.username &&
                      item.user.firstName +
                        ' ' +
                        item.user.lastName +
                        ' (' +
                        item.user.username +
                        ')'}
                  </Text>
                  {
                    <View className="mb-2 mr-2 ml-auto flex-row">
                      <Ionicon
                        name="checkmark-circle-outline"
                        size={24}
                        color="green"
                        onPress={() => handleAccept(item)}
                      />
                      <Ionicon
                        name="close-circle-outline"
                        color="red"
                        size={24}
                        onPress={() => handleDeny(item)}
                      />
                    </View>
                  }
                </View>
              )}
            />
          </View>
        )}
      </View>
    )
  );
};

export default GroupScreen;
