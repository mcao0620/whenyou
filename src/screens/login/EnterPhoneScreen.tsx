import {Formik} from 'formik';
import React from 'react';
import {View, Text, TextInput, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import * as Yup from 'yup';
import {useSetConfirmation} from '../../store/store';
import {PHONE_NUMBER_LEN} from '../../types/globalConstants';

const EnterPhoneScreen = () => {
  const navigation = useNavigation<any>();
  const setConfirmation = useSetConfirmation();
  const COUNTRY_CODE = '+1';

  const setConfirmationWrapper = async (value: any) => {
    setConfirmation(value);
  };

  const validationSchema = Yup.object().shape({
    phone: Yup.string()
      .required()
      .trim()
      .length(PHONE_NUMBER_LEN)
      .matches(/\d{10}/, 'Please enter your 10 digit number.')
      .label('Phone'),
  });

  const handleLogin = (values: any, actions: any) => {
    auth()
      .signInWithPhoneNumber(COUNTRY_CODE + values.phone)
      .then(async res => {
        await setConfirmationWrapper(res);
        navigation.navigate('VerifyPhone');
      })
      .catch(error => {
        switch (error.code) {
          case 'auth/invalid-phone-number':
            actions.setErrors({phone: 'Invalid Phone Number.'});
            break;
          case 'auth/too-many-requests':
            actions.setErrors({
              phone: 'Too many requests. Please try again later.',
            });
            break;
          case 'auth/network-request-failed':
            actions.setErrors({
              phone: 'Network request failed. Please check your connection.',
            });
            break;
          default:
            actions.setErrors({
              phone: 'Something went wrong. Please try again.',
            });
        }
      });
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="w-full p-4 text-left text-3xl font-bold">
        My number is
      </Text>
      <Formik
        initialValues={{
          phone: '',
        }}
        validationSchema={validationSchema}
        validateOnBlur={false}
        validateOnChange={false}
        onSubmit={handleLogin}>
        {({handleChange, handleSubmit, errors}) => (
          <>
            <View className="flex-row justify-center">
              <Text className="w-14 text-center text-3xl text-stone-400">
                +1
              </Text>
              <TextInput
                className="flex-1 text-left text-3xl"
                autoFocus={true}
                maxLength={PHONE_NUMBER_LEN}
                placeholder="Phone #"
                placeholderTextColor={'#A8A29E'}
                onChangeText={handleChange('phone')}
                keyboardType="numeric"
              />
            </View>
            {errors.phone && (
              <Text className="mb-2 w-full pl-16 pt-2 text-left text-red-500">
                {errors.phone}
              </Text>
            )}
            <Text className="w-full p-4 text-left text-xs text-stone-800">
              We will send you a verification code via SMS.
            </Text>
            <TouchableOpacity
              onPress={handleSubmit}
              className="mt-4 mb-64 h-12 w-60 items-center justify-center rounded-3xl bg-black">
              <Text className="text-md font-bold text-white">Enter</Text>
            </TouchableOpacity>
          </>
        )}
      </Formik>
    </View>
  );
};

export default EnterPhoneScreen;
