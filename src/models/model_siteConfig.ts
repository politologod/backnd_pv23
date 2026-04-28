import {  DataTypes, Model  } from 'sequelize';
import sequelize from '../configs/database';
import User from './model_user';

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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
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
  }
);

// Relación con el usuario que actualizó la configuración
SiteConfig.belongsTo(User, { foreignKey: 'last_updated_by', as: 'lastUpdatedBy' });

export default SiteConfig; 