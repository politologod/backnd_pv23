import { ISiteConfig } from '../types/models';
import {  DataTypes, Model  } from 'sequelize';
import sequelize from '../configs/database';
import User from './model_user';

/**
 * Modelo para guardar configuraciones del sitio/tienda
 * Expandido para soportar template SaaS multi-vertical
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descripción de la tienda',
    },
    logoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL del logo de la tienda',
    },
    primaryColor: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Color primario de la marca (hex)',
    },
    paymentMethods: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array de métodos de pago configurados [{id, label, enabled}]',
    },
    shippingMethods: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array de métodos de envío configurados [{id, label, enabled}]',
    },
    currencyConfig: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: 'Configuración de moneda {primary, secondary, exchangeRate}',
    },
    schedule: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: 'Horarios de operación de la tienda',
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