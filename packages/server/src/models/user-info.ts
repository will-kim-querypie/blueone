import { Model, DataTypes, ModelValidateOptions } from 'sequelize';
import dayjs from '@/utils/dayjs';
import sequelize from './_sequelize';
import type { Database } from './index';

const regex = {
  phoneNumber: /^\d{7,32}$/,
  dateOfBirth: /^\d{6}$/,
  licenseNumber: /^[\d-가-힣ㄱ-ㅎ]{1,32}$/,
  insuranceNumber: /^[\d-]{1,32}$/,
};
const validate: { [column in keyof typeof regex]: ModelValidateOptions } = Object.fromEntries(
  Object.entries(regex).map((column, regex) => [column, { is: regex }]),
);

class UserInfo extends Model {
  public readonly id!: number;
  public userId!: number;
  public realname!: string;
  public dateOfBirth!: string;
  public licenseNumber!: string;
  public licenseType!: string;
  public insuranceNumber!: string;
  public insuranceExpirationDate!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associate = (db: Database): void => {
    db.UserInfo.belongsTo(db.User, { foreignKey: 'userId' });
  };
}

UserInfo.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    realname: {
      type: DataTypes.STRING(32),
      validate: validate.phoneNumber,
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.STRING(6),
      validate: validate.dateOfBirth,
      allowNull: false,
      field: 'date_of_birth',
    },
    licenseNumber: {
      type: DataTypes.STRING(32),
      validate: validate.licenseNumber,
      allowNull: false,
      field: 'license_number',
    },
    licenseType: {
      type: DataTypes.STRING(32),
      allowNull: false,
      field: 'license_type',
    },
    insuranceNumber: {
      type: DataTypes.STRING(32),
      validate: validate.insuranceNumber,
      allowNull: false,
      field: 'insurance_number',
    },
    insuranceExpirationDate: {
      type: DataTypes.DATEONLY,
      get() {
        return dayjs(this.getDataValue('insuranceExpirationDate')).format('YYYY-MM-DD');
      },
      allowNull: false,
      field: 'insurance_expiration_date',
    },
  },
  {
    sequelize,
    tableName: 'user_info',
    modelName: 'UserInfo',
    timestamps: true,
    underscored: true,
  },
);

export default UserInfo;
