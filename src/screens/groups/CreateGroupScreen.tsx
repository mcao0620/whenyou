import {Formik} from 'formik';
import React, {useState, useEffect} from 'react';
import {View, Text, Button, TextInput, TouchableOpacity} from 'react-native';
import FastImage from 'react-native-fast-image';
import * as Yup from 'yup';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import storage from '@react-native-firebase/storage';
import 'react-native-get-random-values';
import {customAlphabet} from 'nanoid';
import ImagePicker from 'react-native-image-crop-picker';
import {
  useAuthCurrentUser,
  useCurrentUserInfo,
  useCurrentGroupObjects,
} from '../../store/store';
import JoinGroupModal from '../../components/JoinGroupModal';
import {
  GROUP_ID_LENGTH,
  MAX_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from '../../types/globalConstants';

const CreateGroupScreen = () => {
  const validationSchema = Yup.object().shape({
    groupName: Yup.string().required().trim().label('Group Name'),
    description: Yup.string().required().trim().label('Group Description'),
  });

  const navigation = useNavigation<any>();
  const [useDefaultPhoto, setUseDefaultPhoto] = useState(true);
  const [groupPhoto, setGroupPhoto] = useState('');

  const uid = useAuthCurrentUser()?.uid;
  const currUserInfo = useCurrentUserInfo();
  const {currentGroupInfo} = useCurrentGroupObjects();

  useEffect(() => {
    const fetchData = async () => {
      const url = await storage()
        .ref('default_group_pic.jpeg')
        .getDownloadURL();
      return url;
    };
    fetchData()
      .then(url => {
        if (useDefaultPhoto) {
          setGroupPhoto(url);
        }
      })
      .catch(console.error);
  });

  const selectFile = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
    })
      .then(image => {
        setUseDefaultPhoto(false);
        setGroupPhoto(image.path);
      })
      .catch(err => {
        console.log(err);
      });
  };

  // generate unique 6 digit alphanumeric, case-insensitive group id
  const generateGroupID = async () => {
    const nanoid = customAlphabet(
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      GROUP_ID_LENGTH,
    );
    while (true) {
      let gid = nanoid();
      let doc = await firestore().collection('Groups').doc(gid).get();
      if (!doc.exists) {
        // ensure gid doesn't already exist, otherwise keep generating
        return gid;
      }
    }
  };

  const handleGroupCreation = async (values: any) => {
    // bug if user is accepted into a group while trying to create one
    if (currUserInfo && currUserInfo.groups.length > 0) {
      return;
    }

    values.groupName = values.groupName.trim();
    values.description = values.description.trim();

    // define current user as owner/member of group
    values.owner = uid;
    values.users = [values.owner];
    values.gid = await generateGroupID();

    // update group in backend + group global state to include user
    if (useDefaultPhoto) {
      values.groupPicUrl = groupPhoto;
    } else {
      const filename = 'grouppic';
      const fileLocation = `grouppics/${values.gid}/${filename}`;
      const ref = storage().ref(fileLocation);
      ref
        .putFile(groupPhoto)
        .on(storage.TaskEvent.STATE_CHANGED, async snapshot => {
          // this block of code executes asynchronously later
          if (snapshot.state === storage.TaskState.SUCCESS) {
            const url = await storage().ref(fileLocation).getDownloadURL();
            values.groupPicUrl = url;
            await firestore()
              .collection('Groups')
              .doc(values.gid)
              .set({groupPicUrl: url}, {merge: true});
          }
        });
    }

    // create the group object
    await firestore()
      .collection('Groups')
      .doc(values.gid)
      .set(values, {merge: true});

    // see if user has any pending requests and remove from group side
    if (
      currUserInfo &&
      'requests' in currUserInfo &&
      currUserInfo.requests.length > 0
    ) {
      // pending request present
      await firestore()
        .collection('Groups')
        .doc(currUserInfo.requests[0])
        .update({
          requests: firestore.FieldValue.arrayRemove(values.owner), // clear out any pending requests
        });
    }

    // update user in backend + user global state to include gid
    await firestore()
      .collection('Users')
      .doc(values.owner)
      .update({
        groups: firestore.FieldValue.arrayUnion(values.gid),
        requests: [], // clear out any pending requests
      });
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Formik
        initialValues={{
          groupName: '',
          description: '',
          owner: '',
          gid: '',
          users: [],
          requests: [],
        }}
        validationSchema={validationSchema}
        validateOnBlur={false}
        validateOnChange={false}
        onSubmit={handleGroupCreation}>
        {({values, handleChange, handleSubmit, errors}) => (
          <>
            <View className="mb-5">
              {groupPhoto ? (
                <FastImage
                  source={{uri: groupPhoto}}
                  className="mb-2 h-24 w-24 rounded-full"
                />
              ) : (
                <View className="mb-2 h-24 w-24 rounded-full bg-gray-200" />
              )}
              <Button title="Add Photo" onPress={selectFile} />
            </View>

            <View className="w-full px-12">
              <TextInput
                className="w-full py-1 px-4 text-2xl"
                placeholderTextColor={'#A8A29E'}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
                placeholder="Group Name"
                value={values.groupName}
                maxLength={MAX_NAME_LENGTH}
                onChangeText={handleChange('groupName')}
              />
              {errors.groupName && (
                <Text className="mb-2 text-red-500">{errors.groupName}</Text>
              )}
              <TextInput
                className=" w-full py-1 px-4 text-xl"
                multiline={true}
                placeholder="Group Description"
                autoCorrect={false}
                autoCapitalize="none"
                placeholderTextColor={'#A8A29E'}
                value={values.description}
                onChangeText={handleChange('description')}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              {errors.description && (
                <Text className="mb-2 text-red-500">{errors.description}</Text>
              )}
              <TouchableOpacity
                className="mt-4 mb-64 h-12 w-60 items-center justify-center rounded-3xl bg-black"
                onPress={handleSubmit}>
                <Text className="text-md font-bold text-white">
                  Create Group
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Formik>
      <JoinGroupModal
        uid={uid}
        currentGroupInfo={currentGroupInfo}
        isVisible={currUserInfo && currUserInfo.groups.length > 0}
        onClose={() => {
          navigation.goBack();
        }}
        isCreatingGroup={uid === currentGroupInfo?.owner}
      />
    </View>
  );
};
export default CreateGroupScreen;
