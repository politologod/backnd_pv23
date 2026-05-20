// @ts-nocheck
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../configs/database';

interface ThemeConfigAttributes {
  id: number;
  name: string;
  colors: object;
  typography: object;
  layout: object;
  branding: object;
  navigation: object;
  customCss: string | null;
  isActive: boolean;
  isDraft: boolean;
  publishedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ThemeConfigCreationAttributes extends Optional<ThemeConfigAttributes, 'id' | 'customCss' | 'publishedAt'> {}

class ThemeConfig extends Model<ThemeConfigAttributes, ThemeConfigCreationAttributes> implements ThemeConfigAttributes {
  public id!: number;
  public name!: string;
  public colors!: object;
  public typography!: object;
  public layout!: object;
  public branding!: object;
  public navigation!: object;
  public customCss!: string | null;
  public isActive!: boolean;
  public isDraft!: boolean;
  public publishedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ThemeConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'default',
    },
    colors: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        textSecondary: '#6B7280',
        error: '#EF4444',
        success: '#10B981',
        headerBg: '#111827',
        headerText: '#FFFFFF',
        footerBg: '#1F2937',
        footerText: '#D1D5DB',
      },
    },
    typography: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        baseSize: 16,
        headingSizes: { h1: 48, h2: 36, h3: 24, h4: 20 },
      },
    },
    layout: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        maxWidth: 1280,
        headerStyle: 'sticky',
        headerLayout: 'logo-center',
        footerColumns: 4,
        productCardStyle: 'modern',
        gridColumns: { mobile: 1, tablet: 2, desktop: 4 },
        borderRadius: 8,
      },
    },
    branding: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        logoUrl: '',
        logoWidth: 120,
        faviconUrl: '',
        socialLinks: {
          instagram: '',
          facebook: '',
          twitter: '',
          tiktok: '',
          whatsapp: '',
        },
      },
    },
    navigation: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        header: [
          { label: 'Inicio', url: '/', children: [] },
          { label: 'Productos', url: '/products', children: [] },
          { label: 'Categorías', url: '/categories', children: [] },
          { label: 'Contacto', url: '/contact', children: [] },
        ],
        footer: [
          {
            title: 'Información',
            links: [
              { label: 'Sobre Nosotros', url: '/about' },
              { label: 'Contacto', url: '/contact' },
            ],
          },
          {
            title: 'Legal',
            links: [
              { label: 'Términos', url: '/terms' },
              { label: 'Privacidad', url: '/privacy' },
            ],
          },
        ],
      },
    },
    customCss: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isDraft: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ThemeConfig',
    tableName: 'theme_configs',
    timestamps: true,
  }
);

export default ThemeConfig;
