// @ts-nocheck
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../configs/database';

interface PageSectionAttributes {
  id: number;
  pageId: number;
  type: string;
  content: object;
  settings: object;
  sortOrder: number;
  isVisible: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PageSectionCreationAttributes extends Optional<PageSectionAttributes, 'id' | 'settings' | 'sortOrder'> {}

class PageSection extends Model<PageSectionAttributes, PageSectionCreationAttributes> implements PageSectionAttributes {
  public id!: number;
  public pageId!: number;
  public type!: string;
  public content!: object;
  public settings!: object;
  public sortOrder!: number;
  public isVisible!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PageSection.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    pageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'storefront_pages',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM(
        'hero',
        'featured_products',
        'category_grid',
        'banner',
        'banner_carousel',
        'text_block',
        'product_carousel',
        'testimonials',
        'newsletter',
        'image_gallery',
        'video',
        'custom_html',
        'divider',
        'cta_banner',
        'faq',
        'instagram_feed',
        'brand_logos',
        'countdown',
        'rich_text',
        'map'
      ),
      allowNull: false,
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Dynamic content per section type. hero: {heading,subheading,buttonText,buttonUrl,backgroundImage,overlay}. featured_products: {title,productIds[],limit,sortBy}. etc.',
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        backgroundColor: '',
        textColor: '',
        padding: { top: 40, bottom: 40 },
        fullWidth: false,
        animation: 'none',
      },
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'PageSection',
    tableName: 'page_sections',
    timestamps: true,
  }
);

export default PageSection;
