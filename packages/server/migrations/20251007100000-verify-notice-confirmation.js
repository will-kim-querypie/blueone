const { DataTypes } = require('sequelize');

module.exports = {
  up: async queryInterface => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // notice_confirmation 테이블이 존재하는지 확인
      const tableExists = await queryInterface.sequelize.query(
        `SELECT table_name 
         FROM information_schema.tables 
         WHERE table_schema = DATABASE() 
         AND table_name = 'notice_confirmation'`,
        { transaction },
      );

      if (!tableExists[0] || tableExists[0].length === 0) {
        // 테이블이 없으면 생성
        console.log('notice_confirmation 테이블이 없습니다. 생성합니다...');

        await queryInterface.createTable(
          'notice_confirmation',
          {
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
          },
          { transaction },
        );

        console.log('notice_confirmation 테이블 생성 완료');
      } else {
        console.log('notice_confirmation 테이블이 이미 존재합니다.');
      }

      // 인덱스 확인 및 생성
      const indexes = await queryInterface.showIndex('notice_confirmation', { transaction });
      const indexNames = indexes.map(idx => idx.name);

      // 유니크 제약 조건 인덱스
      if (!indexNames.includes('notice_user_unique')) {
        console.log('notice_user_unique 인덱스 생성...');
        await queryInterface.addIndex('notice_confirmation', ['notice_id', 'user_id'], {
          unique: true,
          name: 'notice_user_unique',
          transaction,
        });
        console.log('notice_user_unique 인덱스 생성 완료');
      } else {
        console.log('notice_user_unique 인덱스가 이미 존재합니다.');
      }

      // notice_id 인덱스
      if (!indexNames.some(name => name.includes('notice_id') && name !== 'notice_user_unique')) {
        console.log('notice_id 인덱스 생성...');
        await queryInterface.addIndex('notice_confirmation', ['notice_id'], { transaction });
        console.log('notice_id 인덱스 생성 완료');
      } else {
        console.log('notice_id 인덱스가 이미 존재합니다.');
      }

      // user_id 인덱스
      if (!indexNames.some(name => name.includes('user_id') && name !== 'notice_user_unique')) {
        console.log('user_id 인덱스 생성...');
        await queryInterface.addIndex('notice_confirmation', ['user_id'], { transaction });
        console.log('user_id 인덱스 생성 완료');
      } else {
        console.log('user_id 인덱스가 이미 존재합니다.');
      }

      await transaction.commit();
      console.log('notice_confirmation 검증 및 수정 완료');
    } catch (error) {
      await transaction.rollback();
      console.error('notice_confirmation 검증 중 오류 발생:', error);
      throw error;
    }
  },

  down: async queryInterface => {
    // 이 마이그레이션은 검증 및 수정만 하므로 rollback하지 않음
    console.log('검증 마이그레이션은 rollback하지 않습니다.');
  },
};
