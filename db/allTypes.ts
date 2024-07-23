export enum UserStatus {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  IN_LOBBY = 'IN_LOBBY',
  PLAYING = 'PLAYING',
}

export enum RoomStatus {
  CREATED = 'CREATED',
  READY_TO_START = 'READY_TO_START',
  IN_GAME = 'IN_GAME',
  INACTIVE = 'INACTIVE',
}

export enum GameStage {
  'SELECT_QUESTION' = 'SELECT_QUESTION',
  'SELECT_ANSWERS' = 'SELECT_ANSWERS',
  'ROUND_RESULTS' = 'ROUND_RESULTS',
}

export enum GameUserStatus {
  'CHOOSING_QUESTION' = 'CHOOSING_QUESTION',
  'CHOOSING_ANSWER' = 'CHOOSING_ANSWER',
  'WAITING' = 'WAITING',
  'READY' = 'READY',
}

export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}

export interface IUserEntity extends IBaseEntity {
  nickname: string;
  quest: boolean;
  status: UserStatus;
  userGame: IUserGameEntity[];
  room: IRoomEntity;
}

export interface IRoomEntity extends IBaseEntity {
  name: string;
  private: boolean;
  status: RoomStatus;
  game: IGameEntity;
  users: IUserEntity[];
}

export interface IGameEntity extends IBaseEntity {
  status: GameStage;
  round: number;
  questions: IQuestionEntity[];
  selectedQuestion: IQuestionEntity;
  users: IUserGameEntity[];
  room: IRoomEntity;
}

export interface IUserGameEntity extends IBaseEntity {
  user: IUserEntity;
  game: IGameEntity;
  answers: IAnswerEntity[];
  selectedAnswer: IAnswerEntity;
  score: number;
  isLeader: boolean;
  status: GameUserStatus;
}

export interface IQuestionEntity extends IBaseEntity {
  description: string;
  games: IGameEntity[];
}

export interface IAnswerEntity extends IBaseEntity {
  description: string;
  gameUser: IUserGameEntity[];
}
