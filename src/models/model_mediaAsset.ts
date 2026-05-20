// @ts-nocheck
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../configs/database';

interface MediaAssetAttributes {
  id: number;
  filename: string;
  url: string;
  publicId: string | null;
  type: string;
  mimeType: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  folder: string;
  tags: string[];
  uploadedBy: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MediaAssetCreationAttributes extends Optional<MediaAssetAttributes, 'id' | 'publicId' | 'mimeType' | 'size' | 'width' | 'height' | 'alt' | 'tags' | 'uploadedBy'> {}

class MediaAsset extends Model<MediaAssetAttributes, MediaAssetCreationAttributes> implements MediaAssetAttributes {
  public id!: number;
  public filename!: string;
  public url!: string;
  public publicId!: string | null;
  public type!: string;
  public mimeType!: string | null;
  public size!: number | null;
  public width!: number | null;
  public height!: number | null;
  public alt!: string | null;
  public folder!: string;
  public tags!: string[];
  public uploadedBy!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MediaAsset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    publicId: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('image', 'video', 'document'),
      allowNull: false,
      defaultValue: 'image',
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'File size in bytes',
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    alt: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    folder: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'general',
      comment: 'banners, pages, branding, products, general',
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id_autoincrement',
      },
    },
  },
  {
    sequelize,
    modelName: 'MediaAsset',
    tableName: 'media_assets',
    timestamps: true,
  }
);

export default MediaAsset;
