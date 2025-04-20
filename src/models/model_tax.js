const { DataTypes, Model } = require('sequelize');
const sequelize = require('../configs/database');
const User = require('./model_user');

/**
 * Modelo para diferentes tipos de impuestos
 */
class Tax extends Model {}

Tax.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nombre del impuesto (ej. IVA, IGTF)'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Código único del impuesto (ej. VAT, IGTF)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descripción detallada del impuesto'
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Porcentaje de impuesto (ej. 16.00 para 16%)'
    },
    is_percentage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Si es porcentaje (true) o monto fijo (false)'
    },
    applies_to_all: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Si se aplica a todos los productos por defecto'
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'País al que aplica este impuesto'
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Región o estado al que aplica este impuesto'
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'Tax',
    tableName: 'taxes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['code'],
        name: 'tax_code_unique'
      }
    ]
  }
);

module.exports = Tax; 