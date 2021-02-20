const Constants = require('../constants');

module.exports = {
    up: (queryInterface, Sequelize) =>
      queryInterface.createTable("box_incidences", {
        boxId: {
          allowNull: false,
          onDelete: "CASCADE",
          references: {
            model: "boxes",
            key: "id",
            as: "boxId",
          },
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        userId: {
          type: Sequelize.INTEGER,
          onDelete: "CASCADE",
          references: {
            model: "users",
            key: "id",
            as: "userId",
          },
        },
        description: {
          type: Sequelize.STRING,
          allowNull: false
        }
        
      }),
    down: (queryInterface /* , Sequelize */) => queryInterface.dropTable("box_incidences")
  }