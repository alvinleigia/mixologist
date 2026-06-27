export type MenuItemRecord = {
  id: string;
  organizationId: string;
  locationId: string | null;
  categoryId: string;
  slug: string;
  name: string;
  description: string | null;
  price: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type MenuCategoryRecord = {
  id: string;
  organizationId: string;
  locationId: string | null;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  items: MenuItemRecord[];
};
