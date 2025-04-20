const { DataTypes, Model } = require('sequelize');
const sequelize = require('../configs/database');
const User = require('./model_user');

/**
 * Modelo para guardar configuraciones del sitio
 */
class SiteConfig extends Model {}

SiteConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    maintenance_mode: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    maintenance_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
  {
    sequelize,
    modelName: 'SiteConfig',
    tableName: 'site_configs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Relación con el usuario que actualizó la configuración
SiteConfig.belongsTo(User, { foreignKey: 'last_updated_by', as: 'lastUpdatedBy' });

module.exports = SiteConfig; 