import firestore from '@react-native-firebase/firestore';
import {User, Group} from '../types/types';

export const subscribeToCurrentUserInfo = (
  authCurrentUser: any,
  setCurrentUserInfo: any,
) => {
  return firestore()
    .collection('Users')
    .doc(authCurrentUser?.uid)
    .onSnapshot(snapshot => {
      setCurrentUserInfo(snapshot.data() as User);
    });
};

export const subscribeToCurrentGroupInfo = (
  currentUserInfo: User,
  setCurrentGroupObjects: any,
) => {
  return firestore()
    .collection('Groups')
    .doc(currentUserInfo.groups[0])
    .onSnapshot(async snapshot => {
      const group = snapshot.data();

      const groupUserInfos = new Map<string, User>();
      for (const userId of group?.users) {
        const groupUserInfo = await firestore()
          .collection('Users')
          .doc(userId)
          .get();
        groupUserInfos.set(userId, groupUserInfo.data() as User);
      }

      const groupUserRequestsInfo = new Map<string, User>();
      for (const userId of group?.requests) {
        const groupUserRequestInfo = await firestore()
          .collection('Users')
          .doc(userId)
          .get();
        groupUserRequestsInfo.set(userId, groupUserRequestInfo.data() as User);
      }

      setCurrentGroupObjects({
        currentGroupInfo: group as Group,
        currentGroupUserInfos: groupUserInfos,
        currentGroupUserRequests: groupUserRequestsInfo,
      });
    });
};
