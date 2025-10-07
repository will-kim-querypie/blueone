const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('notice_confirmation', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      notice_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'notice',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      confirmed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // 유니크 제약 조건: 한 유저가 같은 공지를 중복으로 확인할 수 없음
    await queryInterface.addIndex('notice_confirmation', ['notice_id', 'user_id'], {
      unique: true,
      name: 'notice_user_unique',
    });

    // 빠른 조회를 위한 인덱스
    await queryInterface.addIndex('notice_confirmation', ['notice_id']);
    await queryInterface.addIndex('notice_confirmation', ['user_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('notice_confirmation');
  },
};
