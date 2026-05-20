// @ts-nocheck
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../configs/database';

interface StorefrontPageAttributes {
  id: number;
  slug: string;
  title: string;
  type: string;
  seo: object;
  isPublished: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StorefrontPageCreationAttributes extends Optional<StorefrontPageAttributes, 'id' | 'seo' | 'sortOrder'> {}

class StorefrontPage extends Model<StorefrontPageAttributes, StorefrontPageCreationAttributes> implements StorefrontPageAttributes {
  public id!: number;
  public slug!: string;
  public title!: string;
  public type!: string;
  public seo!: object;
  public isPublished!: boolean;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StorefrontPage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('home', 'about', 'contact', 'custom', 'category', 'product', 'faq', 'terms', 'privacy'),
      allowNull: false,
      defaultValue: 'custom',
    },
    seo: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        title: '',
        description: '',
        ogImage: '',
      },
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'StorefrontPage',
    tableName: 'storefront_pages',
    timestamps: true,
  }
);

export default StorefrontPage;
