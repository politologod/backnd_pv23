import { IPaymentMethod } from '../types/models';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../configs/database';

/**
 * Modelo para métodos de pago dinámicos
 * Cada negocio configura sus propios métodos de pago
 */
class PaymentMethod extends Model {}

PaymentMethod.init(
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
      comment: 'Identificador único del método (ej: transferencia, pago_movil)',
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nombre visible del método de pago',
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
      comment: 'Configuración adicional del método (ej: datos bancarios, instrucciones)',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'PaymentMethod',
    tableName: 'payment_methods',
    timestamps: true,
  }
);

export default PaymentMethod;
