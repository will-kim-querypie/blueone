import {
  Model,
  DataTypes,
  HasOneGetAssociationMixin,
  HasOneSetAssociationMixin,
  HasManyAddAssociationMixin,
} from 'sequelize';
import { HasManyRemoveAssociationMixin } from 'sequelize/types';
import sequelize from './_sequelize';
import type { Database, UserInfo, Work } from './index';

class User extends Model {
  public readonly id!: number;
  public role!: 'contractor' | 'subcontractor';
  public phoneNumber!: string;
  public password!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  public getUserInfo!: HasOneGetAssociationMixin<UserInfo>;
  public setUserInfo!: HasOneSetAssociationMixin<UserInfo, number>;
  public addWork!: HasManyAddAssociationMixin<Work, number>;
  public removeWork!: HasManyRemoveAssociationMixin<Work, number>;

  public static associate = (db: Database): void => {
    db.User.hasMany(db.Notice);
    db.User.hasMany(db.Work);
    db.User.hasOne(db.UserInfo);
    db.User.belongsToMany(db.Notice, {
      through: db.NoticeConfirmation,
      foreignKey: 'userId',
      otherKey: 'noticeId',
      as: 'confirmedNotices',
    });
  };
}

User.init(
  {
    role: {
      type: DataTypes.STRING(20),
      validate: {
        isIn: [['contractor', 'subcontractor']],
      },
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      validate: {
        is: /^\d{7,20}$/,
      },
      allowNull: false,
      field: 'phone_number',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'user',
    modelName: 'User',
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
);

export default User;
