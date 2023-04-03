import {create} from 'zustand';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {User, Group} from '../types/types';
import {GameState} from '../types/gameSettings';
import {getGameStateFromDate} from '../screens/HomeScreen';

type Store = {
  confirmation: FirebaseAuthTypes.ConfirmationResult | null;
  authCurrentUser: FirebaseAuthTypes.User | null;
  currentUserInfo: User | null;
  currentGroupInfo: Group | null;
  currentGroupUserInfos: Map<string, User>;
  currentGroupUserRequests: Map<string, User>;
  currentGroupObjects: {
    currentGroupInfo: Group | null;
    currentGroupUserInfos: Map<string, User>;
    currentGroupUserRequests: Map<string, User>;
  };
  currentGameState: GameState;

  setConfirmation: (val: FirebaseAuthTypes.ConfirmationResult | null) => void;
  setAuthCurrentUser: (val: FirebaseAuthTypes.User | null) => void;
  setCurrentUserInfo: (val: User | null) => void;
  setCurrentGroupInfo: (val: Group | null) => void;
  setCurrentGroupUserInfos: (val: Map<string, User>) => void;
  setCurrentGroupUserRequests: (val: Map<string, User>) => void;
  setCurrentGroupObjects: (val: {
    currentGroupInfo: Group | null;
    currentGroupUserInfos: Map<string, User>;
    currentGroupUserRequests: Map<string, User>;
  }) => void;
  setCurrentGameState: (val: GameState) => void;
};

const useStore = create<Store>(set => ({
  confirmation: null,
  authCurrentUser: null,
  currentUserInfo: null,
  currentGroupInfo: {
    groupName: '',
    groupPicUrl: '',
    description: '',
    owner: '',
    gid: '',
    requests: [],
    users: [],
  },
  currentGroupUserInfos: new Map(),
  currentGroupUserRequests: new Map(),
  currentGroupObjects: {
    currentGroupInfo: {
      groupName: '',
      groupPicUrl: '',
      description: '',
      owner: '',
      gid: '',
      requests: [],
      users: [],
    },
    currentGroupUserInfos: new Map(),
    currentGroupUserRequests: new Map(),
  },
  currentGameState: getGameStateFromDate(new Date()),

  setConfirmation: val => set(() => ({confirmation: val})),
  setAuthCurrentUser: val => set(() => ({authCurrentUser: val})),
  setCurrentUserInfo: val => set(() => ({currentUserInfo: val})),
  setCurrentGroupInfo: val => set(() => ({currentGroupInfo: val})),
  setCurrentGroupUserInfos: val => set(() => ({currentGroupUserInfos: val})),
  setCurrentGroupUserRequests: val =>
    set(() => ({currentGroupUserRequests: val})),
  setCurrentGroupObjects: val => set(() => ({currentGroupObjects: val})),
  setCurrentGameState: val => set(() => ({currentGameState: val})),
}));

export const useConfirmation = () => useStore(state => state.confirmation);
export const useAuthCurrentUser = () =>
  useStore(state => state.authCurrentUser);
export const useCurrentUserInfo = () =>
  useStore(state => state.currentUserInfo);
export const useCurrentGroupInfo = () =>
  useStore(state => state.currentGroupInfo);
export const useCurrentGroupUserInfos = () =>
  useStore(state => state.currentGroupUserInfos);
export const useCurrentGroupUserRequests = () =>
  useStore(state => state.currentGroupUserRequests);
export const useCurrentGroupObjects = () =>
  useStore(state => state.currentGroupObjects);
export const useCurrentGameState = () =>
  useStore(state => state.currentGameState);

export const useSetConfirmation = () =>
  useStore(state => state.setConfirmation);
export const useSetAuthCurrentUser = () =>
  useStore(state => state.setAuthCurrentUser);
export const useSetCurrentUserInfo = () =>
  useStore(state => state.setCurrentUserInfo);
export const useSetCurrentGroupInfo = () =>
  useStore(state => state.setCurrentGroupInfo);
export const useSetCurrentGroupUserInfos = () =>
  useStore(state => state.setCurrentGroupUserInfos);
export const useSetCurrentGroupUserRequests = () =>
  useStore(state => state.setCurrentGroupUserRequests);
export const useSetCurrentGroupObjects = () =>
  useStore(state => state.setCurrentGroupObjects);
export const useSetCurrentGameState = () =>
  useStore(state => state.setCurrentGameState);
