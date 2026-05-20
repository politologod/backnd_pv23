import { IShippingMethod } from '../types/models';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../configs/database';

/**
 * Modelo para métodos de envío dinámicos
 * Cada negocio configura sus propios métodos de envío
 */
class ShippingMethod extends Model {}

ShippingMethod.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    slug: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Identificador único del método (ej: delivery_moto, pickup_tienda)',
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nombre visible del método de envío',
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: 'Configuración adicional (ej: tarifa, tiempo estimado)',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'ShippingMethod',
    tableName: 'shipping_methods',
    timestamps: true,
  }
);

export default ShippingMethod;
