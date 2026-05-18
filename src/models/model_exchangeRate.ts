import { IExchangeRate } from '../types/models';
import { DataTypes } from 'sequelize';
import sequelize from '../configs/database';
import User from './model_user';

/**
 * Historial de tasas de cambio.
 * Cada vez que se actualiza la tasa (manual o auto), se crea un nuevo registro
 * y el anterior se marca como inactivo.
 */
const ExchangeRate = sequelize.define<IExchangeRate>('ExchangeRate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  currency_from: {
    type: DataTypes.ENUM('USD', 'EUR'),
    allowNull: false,
    comment: 'Moneda de origen (USD o EUR)',
  },
  currency_to: {
    type: DataTypes.ENUM('VES'),
    allowNull: false,
    defaultValue: 'VES',
    comment: 'Moneda de destino (siempre VES por ahora)',
  },
  rate: {
    type: DataTypes.DECIMAL(18, 6),
    allowNull: false,
    comment: 'Tasa de cambio. Ej: 36.50 significa 1 USD = 36.50 VES',
  },
  source: {
    type: DataTypes.ENUM('manual', 'api'),
    allowNull: false,
    defaultValue: 'manual',
    comment: 'Origen de la tasa: "manual" (puesta por admin) o "api" (obtenida automáticamente)',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Solo una tasa activa por par de monedas. Se desactiva al crear una nueva.',
  },
  set_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del usuario admin que estableció la tasa (solo para fuente manual)',
  },
  valid_from: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha desde la que aplica esta tasa',
  },
}, {
  tableName: 'exchange_rates',
  timestamps: true,
});

// Relación: quien puso la tasa manual
ExchangeRate.belongsTo(User, { foreignKey: 'set_by', as: 'setByUser' });

export default ExchangeRate;
