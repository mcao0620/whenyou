import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
} from 'react-native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import FastImage from 'react-native-fast-image';
import ImagePicker from 'react-native-image-crop-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {MAX_NAME_LENGTH} from '../types/globalConstants';

const EditUser = ({userid, photo, firstName, lastName}: any) => {
  const validationSchema = Yup.object().shape({
    firstName: Yup.string().required().trim().label('First name'),
    lastName: Yup.string().required().trim().label('Last name'),
  });

  const [userPhoto, setUserPhoto] = useState(photo);
  const [modalVisible, setModalVisible] = useState(false);
  const [dirtyImage, setDirtyImage] = useState(false);

  const selectFile = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
    })
      .then(image => {
        setUserPhoto(image.path);
        setDirtyImage(true);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const handleEditUser = () => {
    setModalVisible(true);
  };

  const saveEditUser = async (values: any) => {
    values.firstName = values.firstName.trim();
    values.lastName = values.lastName.trim();

    const userDocRef = firestore().collection('Users').doc(userid);
    if (dirtyImage) {
      const uploadProfilePic = async () => {
        const filename = 'profilepic';
        const fileLocation = `profilepics/${userid}/${filename}`;
        const ref = storage().ref(fileLocation);
        ref
          .putFile(userPhoto)
          .on(storage.TaskEvent.STATE_CHANGED, async snapshot => {
            if (snapshot.state === storage.TaskState.SUCCESS) {
              const url = await storage().ref(fileLocation).getDownloadURL();
              values.profilePicUrl = url;
              await userDocRef.update({profilePicUrl: url});
            }
          });
      };
      await uploadProfilePic();
    }
    await userDocRef.update(values);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity
        onPress={handleEditUser}
        className="mt-16 h-12 w-60 items-center justify-center rounded-3xl bg-black">
        <Text className="text-md font-bold text-white">Edit Profile</Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => {
          setUserPhoto(photo);
          setDirtyImage(false);
          setModalVisible(false);
        }}
        presentationStyle="pageSheet">
        <View className="flex-1 items-center justify-center bg-white">
          <Formik
            initialValues={{
              firstName: firstName,
              lastName: lastName,
            }}
            validationSchema={validationSchema}
            validateOnBlur={false}
            validateOnChange={false}
            onSubmit={saveEditUser}>
            {({dirty, values, handleChange, handleSubmit, errors}) => (
              <>
                <View className="mb-5">
                  <FastImage
                    source={{uri: userPhoto}}
                    className="mb-2 h-24 w-24 rounded-full"
                  />
                  <Button title="Add Photo" onPress={selectFile} />
                </View>

                <View className="w-full px-12">
                  <TextInput
                    className="w-full py-1 px-4 text-2xl"
                    placeholderTextColor={'#A8A29E'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="First Name"
                    value={values.firstName}
                    maxLength={MAX_NAME_LENGTH}
                    onChangeText={handleChange('firstName')}
                  />
                  {errors.firstName && (
                    <Text className="mb-2 text-red-500">
                      {errors.firstName}
                    </Text>
                  )}
                  <TextInput
                    className=" w-full py-1 px-4 text-2xl"
                    multiline={true}
                    placeholder="Last Name"
                    autoCorrect={false}
                    autoCapitalize="none"
                    placeholderTextColor={'#A8A29E'}
                    value={values.lastName}
                    onChangeText={handleChange('lastName')}
                    maxLength={MAX_NAME_LENGTH}
                  />
                  {errors.lastName && (
                    <Text className="mb-2 text-red-500">{errors.lastName}</Text>
                  )}
                  <TouchableOpacity
                    className="mt-4 mb-64 h-12 w-60 items-center justify-center rounded-3xl bg-black"
                    disabled={!dirty && !dirtyImage}
                    onPress={handleSubmit}>
                    <Text className="text-md font-bold text-white">
                      Save Changes
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Formik>
        </View>
      </Modal>
    </View>
  );
};

export default EditUser;
