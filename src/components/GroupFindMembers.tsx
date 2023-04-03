import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {useCurrentGroupObjects} from '../store/store';
import firestore from '@react-native-firebase/firestore';
import stringSimilarity from 'string-similarity';
import CheckBox from '@react-native-community/checkbox';
import FastImage from 'react-native-fast-image';
import {
  STRING_SIMILARITY_CONST,
  MAX_GROUP_SIZE,
  WIDTH_CONST,
} from '../types/globalConstants';

const FindMembers = () => {
  const {currentGroupInfo: group} = useCurrentGroupObjects();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const handleMembersSearch = () => {
    setModalVisible(true);
  };

  useEffect(() => {
    // Query obtains all the users that are not in a group
    const query = firestore()
      .collection('Users')
      .where('groups', '==', [])
      .limit(10);

    query.onSnapshot((snapshot: any) => {
      const results = snapshot.docs.map((doc: any) => {
        return {user: doc.data(), uid: doc.id};
      });
      // Now filter users not in a group by searchQuery
      const filteredResults = results.filter((res: any) => {
        const fullName = `${res.user.firstName} ${res.user.lastName}`;
        const fullNameMatch = stringSimilarity.compareTwoStrings(
          fullName.toLowerCase(),
          searchQuery.toLowerCase(),
        );
        const userNameMatch = stringSimilarity.compareTwoStrings(
          res.user.username.toLowerCase(),
          searchQuery.toLowerCase(),
        );
        return (
          fullNameMatch > STRING_SIMILARITY_CONST ||
          userNameMatch > STRING_SIMILARITY_CONST
        );
      });
      const selectedFilteredResults = filteredResults.map((item: any) => {
        return {...item, isSelected: false};
      });

      setSelectedUsers(selectedFilteredResults);
    });
  }, [searchQuery]);

  // Check the selectedUsers variable for all the users who have isSelected set to true. Add them
  // all to your group
  const handleAddMembers = () => {
    const batch = firestore().batch();
    const gid = group.gid;
    const groupDocRef = firestore().collection('Groups').doc(gid);
    let numSelected = 0;
    selectedUsers.forEach((sUser: any) => {
      // If user has been selected, clear their requests, add them to the group, and add to group users
      if (sUser.isSelected) {
        numSelected += 1;
        const sUserID = sUser.uid;
        const userDocRef = firestore().collection('Users').doc(sUserID);
        // if user has requested to join another group, remove them from that group's requests field
        let requestedGroupID = sUser.user.requests;
        if (requestedGroupID.length > 0) {
          requestedGroupID = requestedGroupID[0];
          const requestedGroupDocRef = firestore()
            .collection('Groups')
            .doc(requestedGroupID);
          batch.update(requestedGroupDocRef, {
            requests: firestore.FieldValue.arrayRemove(sUserID),
          });
        }
        // update user item to include current group id and remove pending requests
        batch.update(userDocRef, {
          groups: firestore.FieldValue.arrayUnion(gid),
          requests: [],
        });

        // update current group members to include user
        batch.update(groupDocRef, {
          users: firestore.FieldValue.arrayUnion(sUserID),
        });
      }
    });
    console.log(numSelected);
    console.log(group);
    if (numSelected + group.users.length <= MAX_GROUP_SIZE) {
      batch.commit().then((res: any) => console.log(res));
    } else {
      Alert.alert(
        'Max Group Size Exceeded!',
        `Groups can handle a maximum of ${MAX_GROUP_SIZE} members at a time. Make sure to stay below this limit!`,
        [
          {
            text: 'OK',
          },
        ],
      );
    }
    setModalVisible(false);
  };

  const renderItem = ({item}) => {
    return (
      <View className="mt-4 w-72 flex-row items-center justify-between">
        {item.user.profilePicUrl && (
          <FastImage
            className="mb-2 h-8 w-8 rounded-full"
            source={{uri: item.user.profilePicUrl}}
          />
        )}
        <Text className="mb-2 ml-2 w-48 text-lg">
          {item.user.username &&
            item.user.firstName +
              ' ' +
              item.user.lastName +
              ' (' +
              item.user.username +
              ')'}
        </Text>
        <View className="px-1">
          <CheckBox
            boxType="square"
            tintColor={'green'}
            disabled={false}
            value={item.isSelected}
            onValueChange={bool => {
              const editedFilteredResults = selectedUsers.filter(
                (user: any) => {
                  if (item.uid === user.uid) {
                    item.isSelected = bool;
                    return item;
                  }
                  return user;
                },
              );
              setSelectedUsers(editedFilteredResults);
            }}
          />
        </View>
      </View>
    );
  };

  return (
    <View>
      <TouchableOpacity
        className={`mt-4 h-12 w-${WIDTH_CONST} items-center justify-center rounded-3xl bg-emerald-700`}
        onPress={handleMembersSearch}>
        <Text className="text-md font-bold text-white">Find Members</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="pageSheet">
        <View className="flex-1 items-center">
          <Text className="my-6 text-center text-2xl font-bold">
            Find Members
          </Text>
          <View style={{flex: 1}}>
            <TextInput
              className="h-12 w-72 border px-10 py-2"
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={selectedUsers}
              renderItem={renderItem}
              keyExtractor={item => item.uid}
            />
          </View>

          <TouchableOpacity
            className="my-8 h-12 w-60 items-center justify-center rounded-3xl bg-black"
            onPress={handleAddMembers}>
            <Text className="text-md font-bold text-white">Add Members</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default FindMembers;
