export const drinkCategories = [
  {
    id: "mocktails",
    name: "Mocktails",
    drinks: [
      { id: "mango-mule", name: "Mango Mule", isActive: true },
      { id: "strawberry-lemonade", name: "Strawberry Lemonade", isActive: true },
      { id: "virgin-mojito", name: "Virgin Mojito", isActive: true },
    ],
  },
  {
    id: "cocktails",
    name: "Cocktails",
    drinks: [
      { id: "mojito", name: "Mojito", isActive: true },
      { id: "margarita", name: "Margarita", isActive: true },
      { id: "sex-on-the-beach", name: "Sex on the Beach", isActive: true },
    ],
  },
] as const;

export type DrinkCategory = (typeof drinkCategories)[number];
export type Drink = DrinkCategory["drinks"][number];
