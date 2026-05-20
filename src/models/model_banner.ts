// @ts-nocheck
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../configs/database';

interface BannerAttributes {
  id: number;
  name: string;
  imageUrl: string;
  imagePublicId: string | null;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  altText: string | null;
  position: string;
  schedule: object | null;
  isActive: boolean;
  sortOrder: number;
  clicks: number;
  impressions: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BannerCreationAttributes extends Optional<BannerAttributes, 'id' | 'imagePublicId' | 'mobileImageUrl' | 'linkUrl' | 'altText' | 'schedule' | 'clicks' | 'impressions' | 'sortOrder'> {}

class Banner extends Model<BannerAttributes, BannerCreationAttributes> implements BannerAttributes {
  public id!: number;
  public name!: string;
  public imageUrl!: string;
  public imagePublicId!: string | null;
  public mobileImageUrl!: string | null;
  public linkUrl!: string | null;
  public altText!: string | null;
  public position!: string;
  public schedule!: object | null;
  public isActive!: boolean;
  public sortOrder!: number;
  public clicks!: number;
  public impressions!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Banner.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    imagePublicId: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    mobileImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    linkUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    altText: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    position: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'inline',
      comment: 'hero, sidebar, popup, inline, header, footer',
    },
    schedule: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: '{ startDate: ISO, endDate: ISO }',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    clicks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    impressions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Banner',
    tableName: 'banners',
    timestamps: true,
  }
);

export default Banner;
