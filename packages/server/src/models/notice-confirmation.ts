import { Model, DataTypes } from 'sequelize';
import sequelize from './_sequelize';
import type { Database } from './index';

class NoticeConfirmation extends Model {
  public readonly id!: number;
  public noticeId!: number;
  public userId!: number;
  public confirmedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associate = (db: Database): void => {
    db.NoticeConfirmation.belongsTo(db.Notice, { foreignKey: 'noticeId' });
    db.NoticeConfirmation.belongsTo(db.User, { foreignKey: 'userId' });
  };
}

NoticeConfirmation.init(
  {
    noticeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'notice_id',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'confirmed_at',
    },
  },
  {
    sequelize,
    tableName: 'notice_confirmation',
    modelName: 'NoticeConfirmation',
    timestamps: true,
    underscored: true,
  },
);

export default NoticeConfirmation;

