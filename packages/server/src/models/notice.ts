import { Model, DataTypes } from 'sequelize';
import sequelize from './_sequelize';
import type { Database } from './index';

class Notice extends Model {
  public readonly id!: number;
  public userId!: number;
  public title!: string;
  public content!: string;
  public startDate!: Date;
  public endDate!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associate = (db: Database): void => {
    db.Notice.belongsTo(db.User, { foreignKey: 'userId' });
    db.Notice.belongsToMany(db.User, {
      through: db.NoticeConfirmation,
      foreignKey: 'noticeId',
      otherKey: 'userId',
      as: 'confirmedUsers',
    });
  };
}

Notice.init(
  {
    title: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'notice',
    modelName: 'Notice',
    timestamps: true,
  },
);

export default Notice;
