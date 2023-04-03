import React, {useState, useEffect} from 'react';
import {View, TouchableOpacity, Text, TextInput, Alert} from 'react-native';
import * as Yup from 'yup';
import {Formik} from 'formik';
import firestore from '@react-native-firebase/firestore';
import Ionicon from 'react-native-vector-icons/Ionicons';
import {
  useAuthCurrentUser,
  useCurrentUserInfo,
  useCurrentGroupObjects,
} from '../../store/store';
import {useNavigation} from '@react-navigation/native';
import JoinGroupModal from '../../components/JoinGroupModal';
import {MAX_GROUP_SIZE, GROUP_ID_LENGTH} from '../../types/globalConstants';

const JoinGroupScreen = () => {
  const [requestSent, setRequestSent] = useState(false);
  const [pendingRequests, setPendingRequests] = useState('');
  const navigation = useNavigation<any>();

  const uid = useAuthCurrentUser()?.uid;
  const userDocumentRef = firestore().collection('Users').doc(uid);
  const currentUserInfo = useCurrentUserInfo();
  const {currentGroupInfo} = useCurrentGroupObjects();

  useEffect(() => {
    if (currentUserInfo) {
      if ('groups' in currentUserInfo && currentUserInfo.groups.length > 0) {
        // user has been accepted/entered into a group
      } else {
        if (
          'requests' in currentUserInfo &&
          currentUserInfo.requests.length > 0
        ) {
          // pending request present
          setPendingRequests(currentUserInfo.requests[0]); // only one open request at a time
          setRequestSent(true);
        } else {
          setPendingRequests('');
          setRequestSent(false);
        }
      }
    }
  }, [currentUserInfo]);

  const validationSchema = Yup.object().shape({
    code: Yup.string()
      .required()
      .trim()
      .length(GROUP_ID_LENGTH)
      .matches(/^[0-9A-Za-z]+$/, 'Alphanumeric Characters Only')
      .label('Code'),
  });

  const addPendingRequest = async (
    newUid: any,
    gid: string,
    groupReference: any,
  ) => {
    // add request to user object in backend
    await userDocumentRef.update({
      requests: firestore.FieldValue.arrayUnion(gid),
    });

    // add request to group object in backend
    await groupReference.update({
      requests: firestore.FieldValue.arrayUnion(newUid), // arrayUnion automatically prevents duplicates
    });
  };

  const joinEmptyGroup = async (
    newUid: any,
    gid: string,
    groupReference: any,
  ) => {
    // add group to user object
    await userDocumentRef.update({
      groups: firestore.FieldValue.arrayUnion(gid),
    });

    // add user to group object and mark as owner
    await groupReference.update({
      owner: newUid,
      users: firestore.FieldValue.arrayUnion(newUid),
    });
  };

  const verifyCode = (values: any) => {
    const fetchGroupData = async (gid: string) => {
      const groupReference = firestore().collection('Groups').doc(gid);
      const doc = await groupReference.get();
      let currError = '';

      // check if group exists
      if (doc.exists) {
        // ensure user hasn't joined group already
        const groupUsers = doc?.data()?.users;
        if (!groupUsers.includes(uid)) {
          // only send request if group has space
          if (groupUsers.length < MAX_GROUP_SIZE) {
            if (groupUsers.length > 0) {
              // request to join existing group
              addPendingRequest(uid, gid, groupReference);
            } else {
              // group is empty - automatically join
              joinEmptyGroup(uid, gid, groupReference);
            }
            currError = '';
          } else {
            currError = 'Group is full!';
          }
        } else {
          currError = 'User already in this group!';
        }
      } else {
        currError = 'Group does not exist!';
      }
      if (currError.length > 0) {
        Alert.alert('Cannot Join Group', currError, [
          {
            text: 'Dismiss',
          },
        ]);
      }
    };
    fetchGroupData(values.code.toUpperCase().trim()).catch(console.error);
  };

  const removePendingRequest = async () => {
    // remove request from user side
    await userDocumentRef.update({
      requests: [],
    });

    // remove request from group side
    await firestore()
      .collection('Groups')
      .doc(pendingRequests)
      .update({
        requests: firestore.FieldValue.arrayRemove(uid),
      });
  };

  return (
    <>
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-2xl font-bold">Enter Group Code</Text>
        <Formik
          initialValues={{code: ''}}
          validationSchema={validationSchema}
          validateOnBlur={false}
          validateOnChange={false}
          onSubmit={verifyCode}>
          {({handleChange, handleSubmit, errors}) => (
            <>
              <View className="flex-row items-center">
                <TextInput
                  className="w-70 mt-2 h-10 text-2xl"
                  autoFocus={true}
                  editable={!requestSent}
                  autoCorrect={false} // disable autocorrect
                  keyboardType="default"
                  autoCapitalize="characters" // group codes are all uppercase + numeric
                  placeholder={requestSent ? pendingRequests : 'Code'}
                  placeholderTextColor="#C7C7CD"
                  onChangeText={handleChange('code')}
                />
                {requestSent && (
                  <Ionicon
                    name="close-circle-outline"
                    color="red"
                    size={24}
                    onPress={removePendingRequest}
                  />
                )}
              </View>

              {errors.code && (
                <Text className="mt-2 mb-2 text-red-500">{errors.code}</Text>
              )}

              <TouchableOpacity
                disabled={requestSent} // disable button after request has been sent
                onPress={handleSubmit}
                className={`mt-4 mb-64 h-12 w-60 items-center justify-center rounded-3xl ${
                  requestSent ? 'bg-zinc-400' : 'bg-black'
                }`}>
                <Text className="text-md font-bold text-white">
                  {requestSent ? 'Requested' : 'Request'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Formik>
        <JoinGroupModal
          uid={uid}
          currentGroupInfo={currentGroupInfo}
          isVisible={currentUserInfo && currentUserInfo.groups.length > 0}
          onClose={() => navigation.goBack()}
          isCreatingGroup={false}
        />
      </View>
    </>
  );
};

export default JoinGroupScreen;
