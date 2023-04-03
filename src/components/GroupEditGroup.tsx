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
import {
  MAX_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from '../types/globalConstants';

const EditGroup = ({groupid, photo, name, description}: any) => {
  const validationSchema = Yup.object().shape({
    groupName: Yup.string().required().trim().label('Group Name'),
    description: Yup.string().required().trim().label('Group Description'),
  });

  const [groupPhoto, setGroupPhoto] = useState(photo);
  const [modalVisible, setModalVisible] = useState(false);
  const [dirtyImage, setDirtyImage] = useState(false);

  const selectFile = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
    })
      .then(image => {
        setGroupPhoto(image.path);
        setDirtyImage(true);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const handleEditGroup = () => {
    setModalVisible(true);
  };

  const saveEditGroup = async (values: any) => {
    values.groupName = values.groupName.trim();
    values.description = values.description.trim();

    const groupDocRef = firestore().collection('Groups').doc(groupid);
    if (dirtyImage) {
      const uploadGroupPic = async () => {
        const filename = 'grouppic';
        const fileLocation = `grouppics/${groupid}/${filename}`;
        const ref = storage().ref(fileLocation);
        ref
          .putFile(groupPhoto)
          .on(storage.TaskEvent.STATE_CHANGED, async snapshot => {
            if (snapshot.state === storage.TaskState.SUCCESS) {
              const url = await storage().ref(fileLocation).getDownloadURL();
              values.groupPicUrl = url;
              await groupDocRef.update({groupPicUrl: url});
            }
          });
      };
      await uploadGroupPic();
    }
    await groupDocRef.update(values);
    setModalVisible(false);
  };

  return (
    <View className="ml-4">
      <TouchableOpacity
        onPress={handleEditGroup}
        className="ml-1 h-6 w-24 items-center justify-center rounded-3xl border-2 border-emerald-700">
        <Text className="flex-column items-middle text-emerald-700">
          Edit group
        </Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => {
          setGroupPhoto(photo);
          setDirtyImage(false);
          setModalVisible(false);
        }}
        presentationStyle="pageSheet">
        <View className="flex-1 items-center justify-center bg-white">
          <Formik
            initialValues={{
              groupName: name,
              description: description,
            }}
            validationSchema={validationSchema}
            validateOnBlur={false}
            validateOnChange={false}
            onSubmit={saveEditGroup}>
            {({dirty, values, handleChange, handleSubmit, errors}) => (
              <>
                <View className="mb-5">
                  <FastImage
                    source={{uri: groupPhoto}}
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
                    placeholder="Group Name"
                    value={values.groupName}
                    maxLength={MAX_NAME_LENGTH}
                    onChangeText={handleChange('groupName')}
                  />
                  {errors.groupName && (
                    <Text className="mb-2 text-red-500">
                      {errors.groupName}
                    </Text>
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
                    <Text className="mb-2 text-red-500">
                      {errors.description}
                    </Text>
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

export default EditGroup;
