import React, {useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export interface Group {
  groupName: string;
  description: any;
  owner: string;
  password: string;
  users: Array<string>;
}

const MyGroupScreen = () => {
  const [group, setGroup] = useState<Group>({
    groupName: '',
    description: '',
    owner: '',
    password: '',
    users: [],
  });

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    const fetchData = async () => {
      const userInfo = await firestore().collection('Users').doc(uid).get();
      const userGroups = (userInfo.data() as any).groups;

      // Make sure user has joined a group before fetching data
      if ('groups' in userInfo.data && userGroups.length > 0) {
        console.log('User has joined groups');
        // TODO: User can only join one group as of now - update this for multiple groups
        const MAX_NUM_GROUPS = 1;
        for (let i = 0; i < MAX_NUM_GROUPS; i++) {
          const groupInfo = await firestore()
            .collection('Groups')
            .doc(userGroups[i])
            .get();
          console.log(groupInfo.data());
          setGroup(groupInfo.data() as Group);
        }
      }
    };
    fetchData().catch(console.error);
  }, []);

  const noGroupsText = (
    <Text className="text-lg font-bold text-black">
      {' '}
      Please Join a Group First
    </Text>
  );

  const welcomeText = (
    <Text className="text-lg font-bold text-black">
      {' '}
      Welcome to the Group '{group.groupName}'
    </Text>
  );

  return (
    <>
      <View className="flex-1 items-center justify-center bg-white">
        {group.groupName !== '' && welcomeText}
        {group.groupName === '' && noGroupsText}
        <Text className="text-md font-bold text-white">Hello</Text>
      </View>
    </>
  );
};

export default MyGroupScreen;
