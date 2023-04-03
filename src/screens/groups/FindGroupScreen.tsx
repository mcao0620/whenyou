import React, {useEffect, useState} from 'react';
import {View, TouchableOpacity, FlatList, Text, TextInput} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const FindGroupScreen = () => {
  const [groupData, setGroupData] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [displayData, setDisplayData] = useState(groupData);

  // fetch all groups from firestore
  useEffect(() => {
    const uid = auth().currentUser?.uid;
    const fetchData = async () => {
      // fetch user's groups
      const userReq = await firestore().collection('Users').doc(uid).get();
      const userReqData = userReq.data() as any;
      let userGroups: string[] = [];
      if (userReq && 'groups' in userReqData && userReqData.groups.length > 0) {
        console.log(userReqData.groups);
        userGroups = userReqData.groups;
      }

      // fetch group data
      const groupReq = await firestore().collection('Groups').get();

      // filter out groups that the user is in
      const allGroups = groupReq.docs
        .map(doc => doc.data())
        .filter(doc => !userGroups.includes(doc.gid));
      console.log(allGroups);
      setGroupData(allGroups);
      setDisplayData(allGroups);
    };
    fetchData().catch(console.error);
  }, []);

  // handle search for groups
  const handleSearch = (text: any) => {
    const formattedQuery = text.toLowerCase();
    let filteredData = [];
    for (let i = 0; i < groupData.length; i++) {
      if (groupData[i].groupName.toLowerCase().includes(formattedQuery)) {
        filteredData.push(groupData[i]);
      }
    }
    setDisplayData(filteredData);
    setQuery(text);
  };

  return (
    <>
      <View className="flex-1 items-center bg-white">
        <FlatList
          ListHeaderComponent={
            <View className="y-3 justify-center rounded-2xl border-2 border-solid p-3">
              <View className="w-60 flex-row">
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="always"
                  value={query}
                  onChangeText={queryText => handleSearch(queryText)}
                  placeholder="Search"
                  className="w-60 justify-center bg-white px-3"
                />
              </View>
            </View>
          }
          data={displayData}
          keyExtractor={item => item.groupName}
          renderItem={({item}) => (
            <>
              <View className="mt-10 rounded-lg bg-zinc-200 px-4 py-4">
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-2xl font-bold text-black">
                      {item.groupName}
                    </Text>
                  </View>
                  <View>
                    <TouchableOpacity className="h-8 w-16 items-center justify-center rounded-3xl bg-zinc-400">
                      <Text className="text-md font-bold text-black">Join</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View>
                  <Text className="text-lg text-black">{item.description}</Text>
                </View>
              </View>
            </>
          )}
        />
      </View>
    </>
  );
};

export default FindGroupScreen;
