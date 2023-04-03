import React from 'react';
import {View, Text, TouchableOpacity, Modal} from 'react-native';

const JoinGroupModal = ({
  uid,
  currentGroupInfo,
  isVisible,
  onClose,
  isCreatingGroup,
}: any) => {
  return (
    <Modal
      animationType="slide"
      visible={isVisible}
      onRequestClose={onClose}
      presentationStyle="pageSheet">
      <View className="flex-1 items-center justify-center">
        <Text className="my-6 text-center text-3xl font-bold">
          {' '}
          Welcome to {currentGroupInfo?.groupName}!
        </Text>
        {isCreatingGroup ? (
          // render when creating a group
          <View>
            <Text className="mx-5 mt-6 text-center text-xl">
              To invite people to your group, ask them to join with the
              following code:
            </Text>
            <Text className="mt-3 mb-8 text-center text-3xl font-bold text-blue-700">
              {' '}
              {currentGroupInfo?.gid}
            </Text>
          </View>
        ) : uid === currentGroupInfo?.owner ? (
          // render when joining an empty group
          <Text className="mx-5 my-6 text-center text-xl">
            You are now the owner of this group.
          </Text>
        ) : (
          // render when joining an existing group
          <Text className="mx-5 my-6 text-center text-xl">
            Your request to join has been accepted.
          </Text>
        )}
        <TouchableOpacity
          className="my-8 h-12 w-60 items-center justify-center rounded-3xl bg-black"
          onPress={onClose}>
          <Text className="text-md font-bold text-white">OK</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default JoinGroupModal;
