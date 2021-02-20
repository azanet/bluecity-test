const Constants = require('../constants');

module.exports = {
    up: (queryInterface, Sequelize) =>
      queryInterface.createTable("scooter_incidences", {
        scooterId: {
          allowNull: false,
          onDelete: "CASCADE",
          references: {
            model: "scooters",
            key: "id",
            as: "scooterId",
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
    down: (queryInterface /* , Sequelize */) => queryInterface.dropTable("scooter_incidences")
}