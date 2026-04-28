'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'metaTitle', {
      type: Sequelize.STRING(150),
      allowNull: true
    });
    
    await queryInterface.addColumn('Products', 'metaDescription', {
      type: Sequelize.STRING(320),
      allowNull: true
    });
    
    await queryInterface.addColumn('Products', 'seoKeywords', {
      type: Sequelize.STRING(250),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Products', 'metaTitle');
    await queryInterface.removeColumn('Products', 'metaDescription');
    await queryInterface.removeColumn('Products', 'seoKeywords');
  }
}; 