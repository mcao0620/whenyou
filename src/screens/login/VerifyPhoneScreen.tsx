import {Formik} from 'formik';
import React, {useContext} from 'react';
import {View, Text, TextInput, TouchableOpacity} from 'react-native';
import * as Yup from 'yup';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import {LoggedInContext} from '../../contexts/LoggedInContext';
import {useConfirmation} from '../../store/store';
import {VERIFY_PHONE_LEN} from '../../types/globalConstants';

const VerifyPhoneScreen = () => {
  const confirmation = useConfirmation();
  const {setIsLoggedIn} = useContext(LoggedInContext);
  const navigation = useNavigation<any>();

  const validationSchema = Yup.object().shape({
    code: Yup.string()
      .required()
      .trim()
      .length(VERIFY_PHONE_LEN)
      .matches(/\d{6}/, 'Invalid Code.')
      .label('Code'),
  });

  const verifyCode = (values: any, actions: any) => {
    if (confirmation) {
      confirmation
        .confirm(values.code.trim())
        .then(async () => {
          if (auth().currentUser?.displayName) {
            setIsLoggedIn(true);
          } else {
            navigation.navigate('CreateAccount');
          }
        })
        .catch(() => {
          actions.setErrors({code: 'Invalid Code.'});
        });
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold">Enter Code</Text>
      <Formik
        initialValues={{
          code: '',
        }}
        validationSchema={validationSchema}
        validateOnBlur={false}
        validateOnChange={false}
        onSubmit={verifyCode}>
        {({handleChange, handleSubmit, errors}) => (
          <>
            <TextInput
              className="w-70 mt-2 h-10 text-2xl"
              autoFocus={true}
              keyboardType="numeric"
              autoCapitalize="none"
              maxLength={VERIFY_PHONE_LEN}
              placeholder="Enter 6-digit Code"
              onChangeText={handleChange('code')}
            />
            {errors.code && (
              <Text className="mt-2 mb-2 text-red-500">{errors.code}</Text>
            )}
            <Text className="w-full p-4 text-center text-xs text-stone-800">
              New users will be directed to create an account.
            </Text>
            <TouchableOpacity
              onPress={handleSubmit}
              className="mt-4 mb-64 h-12 w-60 items-center justify-center rounded-3xl bg-black">
              <Text className="text-md font-bold text-white">Submit</Text>
            </TouchableOpacity>
          </>
        )}
      </Formik>
    </View>
  );
};

export default VerifyPhoneScreen;
