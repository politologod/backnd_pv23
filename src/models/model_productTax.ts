import {  DataTypes, Model  } from 'sequelize';
import sequelize from '../configs/database';

/**
 * Modelo para asociar impuestos específicos a productos
 * Permite eximir o aplicar impuestos específicos a productos individuales
 */
class ProductTax extends Model {}

ProductTax.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    tax_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'taxes',
        key: 'id'
      }
    },
    is_exempt: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica si el producto está exento de este impuesto'
    },
    custom_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Tasa de impuesto personalizada para este producto (anula la tasa general)'
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
    modelName: 'ProductTax',
    tableName: 'product_taxes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'tax_id']
      }
    ]
  }
);

export default ProductTax; 