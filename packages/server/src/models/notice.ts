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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
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
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'end_date',
    },
  },
  {
    sequelize,
    tableName: 'notice',
    modelName: 'Notice',
    timestamps: true,
    underscored: true,
  },
);

export default Notice;
