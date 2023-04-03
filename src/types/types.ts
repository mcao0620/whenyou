export interface Group {
  groupName: string;
  groupPicUrl: string;
  description: any;
  owner: string;
  gid: string;
  users: string[];
  requests: string[];
}

export interface User {
  firstName: string;
  lastName: string;
  username: string;
  profilePicUrl: string;
  groups: string[];
  requests: string[];
}

export interface SubmissionGroup {
  key: string;
  photoUrl: string;
  submissionTime: string;
  votes: string[];
  pid: string;
  blurHash: string;
}

export interface SubmissionUser {
  key: string;
  photoUrl: string;
  submissionTime: string;
  pid: string;
  blurHash: string;
}
