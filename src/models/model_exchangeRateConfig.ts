import { IExchangeRateConfig } from '../types/models';
import { DataTypes } from 'sequelize';
import sequelize from '../configs/database';

/**
 * Configuración global del sistema de tasas de cambio.
 * Solo debe existir UNA fila en esta tabla (ID = 1).
 *
 * Modos:
 *  - 'auto'     → El sistema obtiene la tasa de una API externa periódicamente.
 *  - 'manual'   → El admin fija la tasa que quiere. La API no se consulta.
 *  - 'disabled' → No se muestra precio en VES. El frontend solo ve USD/EUR.
 */
const ExchangeRateConfig = sequelize.define<IExchangeRateConfig>('ExchangeRateConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  mode: {
    type: DataTypes.ENUM('auto', 'manual', 'disabled'),
    allowNull: false,
    defaultValue: 'disabled',
    comment: 'Modo activo: auto (API), manual (admin fija la tasa), disabled (sin VES)',
  },
  auto_api_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: 'https://api.exchangerate-api.com/v4/latest/USD',
    comment: 'URL de la API externa para obtener tasas automáticas',
  },
  auto_update_hour: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 8,
    comment: 'Hora del día (0-23) en que se actualiza la tasa automáticamente',
    validate: {
      min: 0,
      max: 23,
    },
  },
  last_auto_update: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Última vez que se actualizó automáticamente la tasa desde la API',
  },
}, {
  tableName: 'exchange_rate_config',
  timestamps: true,
});

export default ExchangeRateConfig;
