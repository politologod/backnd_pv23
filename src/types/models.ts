import { Model, Optional } from 'sequelize';

// --- User ---
export interface UserAttributes {
  id_autoincrement: number;
  name: string;
  googleId?: string | null;
  email?: string | null;
  password?: string | null;
  address?: string | null;
  phone?: string | null;
  profilePic?: string | null;
  role: 'admin' | 'customer' | 'vendor';
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id_autoincrement' | 'role'> {}

export interface IUser extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
  id: number; // alias for id_autoincrement if used anywhere
}

// --- Product ---
export interface ProductAttributes {
  id: number;
  name: string;
  sku?: string | null;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  metadata?: any;
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoKeywords?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'stock'> {}

export interface IProduct extends Model<ProductAttributes, ProductCreationAttributes>, ProductAttributes {
  Categories?: any[];
  setCategories?: (categories: any[]) => Promise<void>;
}

// --- Category ---
export interface CategoryAttributes {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoKeywords?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id'> {}

export interface ICategory extends Model<CategoryAttributes, CategoryCreationAttributes>, CategoryAttributes {}

// --- Order ---
export interface OrderAttributes {
  id: number;
  userId: number;
  status: string;
  total: number;
  subtotal?: number;
  taxes_amount?: number;
  taxes_details?: any;
  shippingAddress: string;
  paymentMethod: string;
  deliveryType: string;
  paymentProofUrl?: string | null;
  paymentProofPublicId?: string | null;
  payerCedula?: string | null;
  payerBankAccount?: string | null;
  payerPhone?: string | null;
  payerName?: string | null;
  payerBank?: string | null;
  transactionLastDigits?: string | null;
  paymentNotes?: string | null;
  paymentDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'status'> {}

export interface IOrder extends Model<OrderAttributes, OrderCreationAttributes>, OrderAttributes {}

// --- OrderItem ---
export interface OrderItemAttributes {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  priceAtPurchase: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id'> {}

export interface IOrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes>, OrderItemAttributes {}

// --- Tax ---
export interface TaxAttributes {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  rate: number;
  is_percentage: boolean;
  applies_to_all: boolean;
  country?: string | null;
  region?: string | null;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaxCreationAttributes extends Optional<TaxAttributes, 'id' | 'is_percentage' | 'applies_to_all' | 'active'> {}

export interface ITax extends Model<TaxAttributes, TaxCreationAttributes>, TaxAttributes {}

// --- ProductTax ---
export interface ProductTaxAttributes {
  id: number;
  productId: number;
  taxId: number;
  is_exempt: boolean;
  custom_rate?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductTaxCreationAttributes extends Optional<ProductTaxAttributes, 'id' | 'is_exempt'> {}

export interface IProductTax extends Model<ProductTaxAttributes, ProductTaxCreationAttributes>, ProductTaxAttributes {}

// --- Cart ---
export interface CartAttributes {
  id: number;
  userId?: number | null;
  sessionId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartCreationAttributes extends Optional<CartAttributes, 'id'> {}

export interface ICart extends Model<CartAttributes, CartCreationAttributes>, CartAttributes {}

// --- CartItem ---
export interface CartItemAttributes {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  price?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItemCreationAttributes extends Optional<CartItemAttributes, 'id' | 'quantity'> {}

export interface ICartItem extends Model<CartItemAttributes, CartItemCreationAttributes>, CartItemAttributes {}

// --- SiteConfig ---
export interface SiteConfigAttributes {
  id: number;
  key: string;
  value: any;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SiteConfigCreationAttributes extends Optional<SiteConfigAttributes, 'id'> {}

export interface ISiteConfig extends Model<SiteConfigAttributes, SiteConfigCreationAttributes>, SiteConfigAttributes {}

// --- OrderStatusHistory ---
export interface OrderStatusHistoryAttributes {
  id: number;
  orderId: number;
  status: string;
  notes?: string | null;
  updatedBy?: number | null;
  updatedByRole?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderStatusHistoryCreationAttributes extends Optional<OrderStatusHistoryAttributes, 'id'> {}

export interface IOrderStatusHistory extends Model<OrderStatusHistoryAttributes, OrderStatusHistoryCreationAttributes>, OrderStatusHistoryAttributes {}

// --- Favorite ---
export interface FavoriteAttributes {
  id: number;
  userId: number;
  productId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FavoriteCreationAttributes extends Optional<FavoriteAttributes, 'id'> {}

export interface IFavorite extends Model<FavoriteAttributes, FavoriteCreationAttributes>, FavoriteAttributes {}
