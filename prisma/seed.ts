import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Users
  const adminPass = await bcrypt.hash("admin123", 10);
  const cashierPass = await bcrypt.hash("cashier123", 10);
  const baristaPass = await bcrypt.hash("barista123", 10);

  await prisma.user.upsert({
    where: { email: "admin@kohimina.com" },
    update: {},
    create: { name: "Admin", email: "admin@kohimina.com", password: adminPass, role: Role.ADMIN },
  });
  await prisma.user.upsert({
    where: { email: "cashier@kohimina.com" },
    update: {},
    create: { name: "Cashier", email: "cashier@kohimina.com", password: cashierPass, role: Role.CASHIER },
  });
  await prisma.user.upsert({
    where: { email: "barista@kohimina.com" },
    update: {},
    create: { name: "Barista", email: "barista@kohimina.com", password: baristaPass, role: Role.BARISTA },
  });

  // Tables 1-15
  for (let i = 1; i <= 15; i++) {
    await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: { number: i, name: `Table ${i}`, capacity: 4 },
    });
  }

  // Categories
  const categories = ["Coffee", "Non-Coffee", "Pastries", "Meals", "Desserts"];
  const createdCategories: Record<string, number> = {};
  for (let i = 0; i < categories.length; i++) {
    const cat = await prisma.category.upsert({
      where: { name: categories[i] },
      update: {},
      create: { name: categories[i], sortOrder: i },
    });
    createdCategories[categories[i]] = cat.id;
  }

  // Ingredients
  const ingredients = [
    { name: "Coffee Beans", unit: "g", currentStock: 5000, lowStockAlert: 500, criticalAlert: 200 },
    { name: "Milk", unit: "ml", currentStock: 10000, lowStockAlert: 1000, criticalAlert: 500 },
    { name: "Chocolate Syrup", unit: "ml", currentStock: 3000, lowStockAlert: 300, criticalAlert: 100 },
    { name: "Sugar", unit: "g", currentStock: 5000, lowStockAlert: 500, criticalAlert: 200 },
    { name: "Vanilla Syrup", unit: "ml", currentStock: 2000, lowStockAlert: 200, criticalAlert: 100 },
    { name: "Caramel Syrup", unit: "ml", currentStock: 2000, lowStockAlert: 200, criticalAlert: 100 },
    { name: "Matcha Powder", unit: "g", currentStock: 1000, lowStockAlert: 100, criticalAlert: 50 },
    { name: "Whipping Cream", unit: "ml", currentStock: 2000, lowStockAlert: 300, criticalAlert: 100 },
    { name: "Bread", unit: "pcs", currentStock: 50, lowStockAlert: 10, criticalAlert: 5 },
    { name: "Butter", unit: "g", currentStock: 1000, lowStockAlert: 100, criticalAlert: 50 },
    { name: "Eggs", unit: "pcs", currentStock: 100, lowStockAlert: 20, criticalAlert: 10 },
    { name: "Ice", unit: "g", currentStock: 10000, lowStockAlert: 1000, criticalAlert: 500 },
  ];

  const createdIngredients: Record<string, number> = {};
  for (const ing of ingredients) {
    const created = await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: {},
      create: ing,
    });
    createdIngredients[ing.name] = created.id;
  }

  // Products
  const products = [
    // Coffee
    { name: "Cafe Latte", description: "Espresso with steamed milk and a light layer of foam", price: 120, category: "Coffee",
      ingredients: [{ name: "Coffee Beans", qty: 20 }, { name: "Milk", qty: 200 }] },
    { name: "Cappuccino", description: "Espresso topped with foamed milk", price: 115, category: "Coffee",
      ingredients: [{ name: "Coffee Beans", qty: 20 }, { name: "Milk", qty: 150 }] },
    { name: "Americano", description: "Espresso diluted with hot water", price: 100, category: "Coffee",
      ingredients: [{ name: "Coffee Beans", qty: 20 }] },
    { name: "Caramel Macchiato", description: "Espresso with vanilla, milk and caramel drizzle", price: 145, category: "Coffee",
      ingredients: [{ name: "Coffee Beans", qty: 20 }, { name: "Milk", qty: 200 }, { name: "Caramel Syrup", qty: 30 }, { name: "Vanilla Syrup", qty: 15 }] },
    { name: "Mocha", description: "Espresso with chocolate and steamed milk", price: 135, category: "Coffee",
      ingredients: [{ name: "Coffee Beans", qty: 20 }, { name: "Milk", qty: 200 }, { name: "Chocolate Syrup", qty: 30 }] },
    // Non-Coffee
    { name: "Matcha Latte", description: "Premium matcha with steamed milk", price: 130, category: "Non-Coffee",
      ingredients: [{ name: "Matcha Powder", qty: 10 }, { name: "Milk", qty: 200 }] },
    { name: "Chocolate Frappe", description: "Blended chocolate drink with whipped cream", price: 140, category: "Non-Coffee",
      ingredients: [{ name: "Chocolate Syrup", qty: 40 }, { name: "Milk", qty: 150 }, { name: "Ice", qty: 200 }, { name: "Whipping Cream", qty: 30 }] },
    { name: "Strawberry Milk", description: "Fresh strawberry with cold milk", price: 110, category: "Non-Coffee",
      ingredients: [{ name: "Milk", qty: 250 }] },
    { name: "Vanilla Shake", description: "Creamy vanilla milkshake", price: 125, category: "Non-Coffee",
      ingredients: [{ name: "Vanilla Syrup", qty: 30 }, { name: "Milk", qty: 200 }, { name: "Ice", qty: 150 }] },
    // Pastries
    { name: "Butter Croissant", description: "Flaky and buttery croissant", price: 75, category: "Pastries",
      ingredients: [{ name: "Butter", qty: 30 }, { name: "Bread", qty: 1 }] },
    { name: "Chocolate Muffin", description: "Rich chocolate muffin with chocolate chips", price: 85, category: "Pastries",
      ingredients: [{ name: "Eggs", qty: 1 }, { name: "Chocolate Syrup", qty: 20 }, { name: "Butter", qty: 20 }] },
    { name: "Cinnamon Roll", description: "Soft roll with cinnamon sugar and icing", price: 95, category: "Pastries",
      ingredients: [{ name: "Butter", qty: 25 }, { name: "Sugar", qty: 30 }, { name: "Eggs", qty: 1 }] },
    // Meals
    { name: "Clubhouse Sandwich", description: "Triple-decker with chicken, bacon, egg and veggies", price: 195, category: "Meals",
      ingredients: [{ name: "Bread", qty: 3 }, { name: "Eggs", qty: 1 }, { name: "Butter", qty: 15 }] },
    { name: "Pasta Carbonara", description: "Creamy pasta with bacon and parmesan", price: 185, category: "Meals",
      ingredients: [{ name: "Eggs", qty: 2 }, { name: "Milk", qty: 50 }] },
    // Desserts
    { name: "Belgian Waffle", description: "Crispy waffle with whipped cream and syrup", price: 155, category: "Desserts",
      ingredients: [{ name: "Eggs", qty: 2 }, { name: "Butter", qty: 30 }, { name: "Whipping Cream", qty: 50 }] },
    { name: "Tiramisu", description: "Classic Italian dessert with coffee and mascarpone", price: 165, category: "Desserts",
      ingredients: [{ name: "Coffee Beans", qty: 15 }, { name: "Eggs", qty: 2 }, { name: "Whipping Cream", qty: 60 }] },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      const created = await prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          price: p.price,
          categoryId: createdCategories[p.category],
        },
      });
      for (const ing of p.ingredients) {
        if (createdIngredients[ing.name]) {
          await prisma.productIngredient.create({
            data: {
              productId: created.id,
              ingredientId: createdIngredients[ing.name],
              quantity: ing.qty,
            },
          });
        }
      }
    }
  }

  console.log("✅ Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
