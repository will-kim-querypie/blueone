const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    // User 테이블 생성
    await queryInterface.createTable('user', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [['admin', 'user']], // 초기값 (나중에 update-user-roles에서 변경됨)
        },
      },
      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    // UserInfo 테이블 생성
    await queryInterface.createTable('user_info', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      realname: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      date_of_birth: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },
      license_number: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      license_type: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      insurance_number: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      insurance_expiration_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Work 테이블 생성 (penalty 포함 - 나중에 remove-penalty에서 제거됨)
    await queryInterface.createTable('work', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      origin: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      waypoint: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      destination: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      car_model: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      charge: {
        type: DataTypes.MEDIUMINT,
        allowNull: false,
      },
      penalty: {
        type: DataTypes.MEDIUMINT,
        allowNull: true,
        // 이 컬럼은 20240707075228-remove-penalty.js에서 제거됨
      },
      subsidy: {
        type: DataTypes.MEDIUMINT,
        allowNull: true,
      },
      remark: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      check_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // booking_date는 처음부터 포함
      booking_date: {
        type: DataTypes.DATE,
        defaultValue: null,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Notice 테이블 생성
    await queryInterface.createTable('notice', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 역순으로 테이블 삭제 (외래키 제약조건 고려)
    await queryInterface.dropTable('notice');
    await queryInterface.dropTable('work');
    await queryInterface.dropTable('user_info');
    await queryInterface.dropTable('user');
  },
};