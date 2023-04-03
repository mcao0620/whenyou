import {Formik} from 'formik';
import React, {useEffect, useState} from 'react';
import {View, Text, TextInput, Button, TouchableOpacity} from 'react-native';
import FastImage from 'react-native-fast-image';
import * as Yup from 'yup';
import ImagePicker from 'react-native-image-crop-picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {useSetAuthCurrentUser} from '../../store/store';
import {MAX_NAME_LENGTH} from '../../types/globalConstants';

const CreateAccountScreen = () => {
  const validationSchema = Yup.object().shape({
    firstName: Yup.string().required().trim().label('First name'),
    lastName: Yup.string().required().trim().label('Last name'),
    username: Yup.string()
      .required()
      .trim()
      .matches(/^[0-9A-Za-z]+$/, 'Alphanumeric Characters Only')
      .label('Username'),
  });

  const [useDefaultPhoto, setUseDefaultPhoto] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState('');
  const setAuthCurrentUser = useSetAuthCurrentUser();

  useEffect(() => {
    const fetchData = async () => {
      const url = await storage()
        .ref('default_profile_pic.jpeg')
        .getDownloadURL();
      return url;
    };
    fetchData()
      .then(url => {
        if (useDefaultPhoto) {
          setProfilePhoto(url);
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
        setProfilePhoto(image.path);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const handleSignUp = async (values: any, errors: any) => {
    // Check to make sure username is not in the database. if it is, error out
    values.firstName = values.firstName.trim();
    values.lastName = values.lastName.trim();
    values.username = values.username.trim().toLowerCase();
    const allUsers = await firestore().collection('Users').get();

    let isUsernameValid = true;
    allUsers.forEach((u: any) => {
      u = u.data();
      if (u.username === values.username) {
        isUsernameValid = false;
        errors.setErrors({
          username: 'Username already exists! Choose a different username.',
        });
      }
    });

    if (isUsernameValid) {
      const authCurrentUser = auth().currentUser;
      await authCurrentUser?.updateProfile({
        displayName: values.username,
      });

      if (useDefaultPhoto) {
        // This is already the download Url that we loaded earlier
        values.profilePicUrl = profilePhoto;
        await firestore()
          .collection('Users')
          .doc(authCurrentUser?.uid)
          .set(values);

        setAuthCurrentUser(auth().currentUser);
      } else {
        const uploadProfilePic = async () => {
          let uid = authCurrentUser?.uid;
          const filename = 'profilepic';
          const fileLocation = `profilepics/${uid}/${filename}`;
          const ref = storage().ref(fileLocation);

          ref
            .putFile(profilePhoto)
            .on(storage.TaskEvent.STATE_CHANGED, async snapshot => {
              if (snapshot.state === storage.TaskState.SUCCESS) {
                const url = await storage().ref(fileLocation).getDownloadURL();
                values.profilePicUrl = url;
                await firestore()
                  .collection('Users')
                  .doc(authCurrentUser?.uid)
                  .set(values);
                setAuthCurrentUser(auth().currentUser);
              }
            });
        };
        await uploadProfilePic();
      }
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Formik
        initialValues={{
          firstName: '',
          lastName: '',
          username: '',
          groups: [],
          requests: [],
        }}
        validationSchema={validationSchema}
        validateOnBlur={false}
        validateOnChange={false}
        onSubmit={handleSignUp}>
        {({values, handleChange, handleSubmit, errors}) => (
          <>
            <View className="mb-5">
              {profilePhoto ? (
                <FastImage
                  source={{uri: profilePhoto}}
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
                placeholder="First Name"
                autoCorrect={false}
                autoFocus={true}
                value={values.firstName}
                maxLength={MAX_NAME_LENGTH}
                onChangeText={handleChange('firstName')}
              />
              {errors.firstName && (
                <Text className="mb-2 text-red-500">{errors.firstName}</Text>
              )}
              <TextInput
                className=" w-full py-1 px-4 text-2xl"
                autoCorrect={false}
                placeholder="Last Name"
                placeholderTextColor={'#A8A29E'}
                value={values.lastName}
                maxLength={MAX_NAME_LENGTH}
                onChangeText={handleChange('lastName')}
              />
              {errors.lastName && (
                <Text className="mb-2 text-red-500">{errors.lastName}</Text>
              )}
              <TextInput
                className="w-full justify-center py-1 px-4 text-2xl"
                autoCapitalize="none"
                placeholder="Username"
                autoCorrect={false}
                placeholderTextColor={'#A8A29E'}
                value={values.username}
                maxLength={MAX_NAME_LENGTH}
                onChangeText={handleChange('username')}
              />
              {errors.username && (
                <Text className="mb-2 text-red-500">{errors.username}</Text>
              )}
            </View>
            <TouchableOpacity
              className="mt-4 mb-64 h-12 w-60 items-center justify-center rounded-3xl bg-black"
              onPress={_ => {
                handleSubmit(values, errors);
              }}>
              <Text className="text-md font-bold text-white">
                Create Account
              </Text>
            </TouchableOpacity>
          </>
        )}
      </Formik>
    </View>
  );
};
export default CreateAccountScreen;
