import { Sequelize } from 'sequelize';
import sequelize from './_sequelize';
import Notice from './notice';
import NoticeConfirmation from './notice-confirmation';
import User from './user';
import UserInfo from './user-info';
import Work from './work';

const db = {
  User,
  UserInfo,
  Notice,
  NoticeConfirmation,
  Work,
  sequelize,
  Sequelize,
};

User.associate(db);
UserInfo.associate(db);
Notice.associate(db);
NoticeConfirmation.associate(db);
Work.associate(db);

export { User, UserInfo, Notice, NoticeConfirmation, Work };
export type Database = typeof db;
export default db;
