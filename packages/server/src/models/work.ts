import { Model, DataTypes } from 'sequelize';
import { PaymentType } from 'typings';
import sequelize from './_sequelize';
import type { Database } from './index';

class Work extends Model {
  public readonly id!: number;
  public userId!: number | null;
  public origin!: string;
  public waypoint!: string | null;
  public destination!: string;
  public carModel!: string;
  public charge!: number;
  public adjustment!: number | null;
  public subsidy!: number | null;
  public paymentType!: PaymentType;
  public remark!: string | null;
  public checkTime!: Date | null;
  public endTime!: Date | null;
  public bookingDate!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associate = (db: Database): void => {
    db.Work.belongsTo(db.User, { foreignKey: 'userId' });
  };
}

Work.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
    },
    origin: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    waypoint: {
      type: DataTypes.STRING(255),
    },
    destination: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    carModel: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'car_model',
    },
    charge: {
      type: DataTypes.MEDIUMINT,
      allowNull: false,
    },
    adjustment: {
      type: DataTypes.MEDIUMINT,
    },
    subsidy: {
      type: DataTypes.MEDIUMINT,
    },
    paymentType: {
      type: DataTypes.STRING(20),
      validate: {
        isIn: [Object.values(PaymentType)],
      },
      allowNull: false,
      field: 'payment_type',
    },
    remark: {
      type: DataTypes.TEXT,
    },
    checkTime: {
      type: DataTypes.DATE,
      field: 'check_time',
    },
    endTime: {
      type: DataTypes.DATE,
      field: 'end_time',
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'booking_date',
    },
  },
  {
    sequelize,
    tableName: 'work',
    modelName: 'Work',
    timestamps: true,
    underscored: true,
  },
);

export default Work;
