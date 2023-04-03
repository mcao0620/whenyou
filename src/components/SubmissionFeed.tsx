import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  FlatList,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import FastImage from 'react-native-fast-image';
import {SubmissionGroup} from '../types/types';
import ImagePicker from 'react-native-image-crop-picker';
import {v4 as uuidv4} from 'uuid';
import storage from '@react-native-firebase/storage';
import SubmissionTile from './SubmissionTile';
import {
  useAuthCurrentUser,
  useCurrentGroupObjects,
  useCurrentGameState,
} from '../store/store';
import {Blurhash} from 'react-native-blurhash';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import {GameState} from '../types/gameSettings';

const SubmissionFeed = ({prompt, user}: any) => {
  const [submissionPhoto, setSubmissionPhoto] = useState('');
  const [resizedSubmission, setResizedSubmission] = useState('');
  const [submissionModalVisible, setSubmissionModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionGroup[]>([]);
  const [activityRefreshIndicator, setActivityRefreshIndicator] =
    useState(false);
  const authCurrentUser = useAuthCurrentUser();
  const {currentGroupInfo} = useCurrentGroupObjects();
  const currentGameState = useCurrentGameState();

  const fetchFeed = useCallback(async () => {
    const today = new Date();
    const gid = user.groups[0];
    let userSubmitted = false;
    const submissionsCollection = await firestore()
      .collection('Submissions-Group')
      .doc(gid)
      .collection(
        `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`,
      )
      .get();
    const submissionObjs = [] as SubmissionGroup[];

    submissionsCollection.forEach(doc => {
      if (doc.id === authCurrentUser?.uid) {
        userSubmitted = true;
      }
      if (currentGroupInfo?.users.includes(doc.id)) {
        submissionObjs.push({
          ...doc.data(),
          key: doc.id,
        } as SubmissionGroup);
      }
    });
    setSubmissions(
      userSubmitted
        ? submissionObjs
        : [
            {
              key: '',
              photoUrl: '',
              submissionTime: '',
              pid: '',
            } as SubmissionGroup,
            ...submissionObjs,
          ],
    );
  }, [user, authCurrentUser, currentGroupInfo]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleUploadPhoto = () => {
    if (currentGameState !== GameState.submit) {
      setActivityRefreshIndicator(true);
      fetchFeed();
      setActivityRefreshIndicator(false);
      return;
    }

    ImagePicker.openPicker({
      width: 600,
      height: 800,
      cropping: true,
    })
      .then(image => {
        // console.log(`image path: ${image.path}`);
        // console.log(`image sourceURL: ${image.sourceURL}`);
        setSubmissionPhoto(`file://${image.path}`);
        ImageResizer.createResizedImage(
          image.path
            ? `file://${image.path}`
            : image.sourceURL
            ? image.sourceURL
            : '',
          75,
          100,
          'JPEG',
          80,
          0,
          undefined,
          false,
        )
          .then(resizedImage => {
            //console.log(`resizedImage uri: ${resizedImage.uri}`);
            setResizedSubmission(resizedImage.uri);
            setSubmissionModalVisible(true);
          })
          .catch(() => {
            Alert.alert(
              'Something went wrong with your upload. Please try again.',
            );
          });
      })
      .catch(err => {
        console.log(err);
      });
  };

  const handleSubmissionSubmit = async () => {
    const today = new Date();
    const submissionTime = today.toISOString();
    const gid = user.groups[0];
    let uid = authCurrentUser?.uid;

    const pid = uuidv4();
    const filename = `${pid}.jpeg`;
    const fileLocation = `submissions/${filename}`;
    const ref = storage().ref(fileLocation);

    const uploadSubmission = async () => {
      ref
        .putFile(submissionPhoto)
        .on(storage.TaskEvent.STATE_CHANGED, async snapshot => {
          if (snapshot.state === storage.TaskState.SUCCESS) {
            const url = await ref.getDownloadURL();
            const blur = await Blurhash.encode(resizedSubmission, 4, 3);
            const submissionsGroupValues = {
              photoUrl: url,
              submissionTime: submissionTime,
              votes: [],
              pid: pid,
              blurHash: blur,
            };
            const submissionsUserValues = {
              photoUrl: url,
              submissionTime: submissionTime,
              pid: pid,
              blurHash: blur,
            };

            const dateString = `${
              today.getMonth() + 1
            }-${today.getDate()}-${today.getFullYear()}`;

            // keep track of group subcollections (dates) for easy access
            await firestore()
              .collection('Submissions-Group')
              .doc(gid)
              .set(
                {dates: firestore.FieldValue.arrayUnion(dateString)},
                {merge: true},
              );

            // upload submission to group backend
            await firestore()
              .collection('Submissions-Group')
              .doc(gid)
              .collection(dateString)
              .doc(uid)
              .set(submissionsGroupValues);

            // keep track of user subcollections (dates) for easy access
            await firestore()
              .collection('Submissions-User')
              .doc(uid)
              .set(
                {dates: firestore.FieldValue.arrayUnion(dateString)},
                {merge: true},
              );

            // upload submission to user backend
            await firestore()
              .collection('Submissions-User')
              .doc(uid)
              .collection(dateString)
              .doc(gid)
              .set(submissionsUserValues);

            await fetchFeed();
            setActivityRefreshIndicator(false);
          }
        });
    };

    if (currentGameState === GameState.submit) {
      await uploadSubmission();
    }

    setSubmissionModalVisible(false);
  };

  return (
    <View className="flex-1 px-1.5 py-1.5">
      {activityRefreshIndicator && (
        <ActivityIndicator size="large" className="absolute inset-2/4 z-10" />
      )}
      <FlatList
        data={submissions}
        numColumns={2}
        horizontal={false}
        refreshControl={
          activityRefreshIndicator ? (
            <></>
          ) : (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchFeed();
                setRefreshing(false);
              }}
            />
          )
        }
        renderItem={item => (
          <View className="h-60 w-1/2 p-1.5">
            <SubmissionTile
              submission={item.item}
              handleSubmissionUpload={handleUploadPhoto}
              submitted={submissions[0].key !== ''}
            />
          </View>
        )}
      />
      <Modal
        animationType="slide"
        visible={submissionModalVisible}
        onRequestClose={() => setSubmissionModalVisible(false)}
        presentationStyle="pageSheet">
        <View className="flex-1 items-center">
          <Text
            style={{width: Dimensions.get('screen').width - 30}}
            className="my-4 text-center text-2xl font-bold">
            {prompt}
          </Text>
          <FastImage
            style={{
              width: Dimensions.get('screen').width - 30,
              height: (7 * Dimensions.get('screen').height) / 12,
            }}
            className="rounded-2xl"
            source={{uri: submissionPhoto}}
          />
          <TouchableOpacity
            className="my-8 h-12 w-60 items-center justify-center rounded-3xl bg-black"
            onPress={() => {
              setActivityRefreshIndicator(true);
              handleSubmissionSubmit();
            }}>
            <Text className="text-md font-bold text-white">Submit</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default SubmissionFeed;
