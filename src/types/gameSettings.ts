export enum GameState {
  submit,
  vote,
  result,
}

export enum GameSettings {
  UPDATE_FREQUENCY = 1000,
  SECONDS_IN_MIN = 60,
  SECONDS_IN_HOUR = 3600,
  SUBMISSION_ENDS = 18 * SECONDS_IN_HOUR,
  VOTING_ENDS = 22 * SECONDS_IN_HOUR,
  GAME_ENDS = 24 * SECONDS_IN_HOUR - 1,
}
