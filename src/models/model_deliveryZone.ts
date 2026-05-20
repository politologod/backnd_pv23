import { IDeliveryZone } from '../types/models';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../configs/database';

/**
 * Modelo para zonas de delivery
 * Permite configurar zonas con tarifas y tiempos diferentes
 */
class DeliveryZone extends Model {}

DeliveryZone.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nombre de la zona de delivery',
    },
    shippingFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Tarifa de envío para esta zona',
    },
    minimumOrder: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Orden mínima requerida para esta zona',
    },
    estimatedTime: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Tiempo estimado de entrega (ej: "30-45 min")',
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'DeliveryZone',
    tableName: 'delivery_zones',
    timestamps: true,
  }
);

export default DeliveryZone;
