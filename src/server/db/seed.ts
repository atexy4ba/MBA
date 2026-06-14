import 'dotenv/config';
import { db, schema } from './index';
import { users, categories, products, variants } from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database...');

  const [existingAdmin] = await db.select().from(users).where(eq(users.email, 'admin@madebyalgerians.com'));
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await db.insert(users).values({
      email: process.env.ADMIN_EMAIL || 'admin@madebyalgerians.com',
      passwordHash,
      role: 'admin',
    });
    console.log('✅ Admin user created');
  } else {
    console.log('⏭️ Admin user already exists');
  }

  const existingCategories = await db.select().from(categories);
  if (existingCategories.length > 0) {
    console.log('⏭️ Categories already seeded');
  } else {
    const rootCategories = [
      { name: 'Hauts Unisexe', slug: 'hauts-unisexe', parentId: null, sortOrder: 1 },
      { name: 'Outerwear', slug: 'outerwear', parentId: null, sortOrder: 2 },
      { name: 'Bas', slug: 'bas', parentId: null, sortOrder: 3 },
      { name: 'Accessoires', slug: 'accessoires', parentId: null, sortOrder: 4 },
      { name: 'Professionnel', slug: 'professionnel', parentId: null, sortOrder: 5 },
    ];

    for (const cat of rootCategories) {
      await db.insert(categories).values(cat);
    }

    const [hauts] = await db.select().from(categories).where(eq(categories.slug, 'hauts-unisexe'));
    if (hauts) {
      await db.insert(categories).values([
        { name: 'T-shirts', slug: 't-shirts', parentId: hauts.id, sortOrder: 1 },
        { name: 'Polos', slug: 'polos', parentId: hauts.id, sortOrder: 2 },
        { name: 'Pulls', slug: 'pulls', parentId: hauts.id, sortOrder: 3 },
      ]);
    }

    const [accessoires] = await db.select().from(categories).where(eq(categories.slug, 'accessoires'));
    if (accessoires) {
      await db.insert(categories).values([
        { name: 'Casquettes', slug: 'casquettes', parentId: accessoires.id, sortOrder: 1 },
        { name: 'Tote Bags', slug: 'tote-bags', parentId: accessoires.id, sortOrder: 2 },
        { name: 'Trousses', slug: 'trousses', parentId: accessoires.id, sortOrder: 3 },
      ]);
    }

    const [pro] = await db.select().from(categories).where(eq(categories.slug, 'professionnel'));
    if (pro) {
      await db.insert(categories).values([
        { name: 'Gilets de travail', slug: 'gilets-de-travail', parentId: pro.id, sortOrder: 1 },
        { name: 'Tenues de cuisine', slug: 'tenues-de-cuisine', parentId: pro.id, sortOrder: 2 },
      ]);
    }

    console.log('✅ Categories created');
  }

  const existingProducts = await db.select().from(products);
  if (existingProducts.length > 0) {
    console.log('⏭️ Products already seeded');
  } else {
    const [tShirtsCat] = await db.select().from(categories).where(eq(categories.slug, 't-shirts'));

    if (tShirtsCat) {
      const [product] = await db.insert(products).values({
        name: 'T-shirt Classique',
        slug: 't-shirt-classique',
        description: 'T-shirt en coton peigné de haute qualité. Confort optimal et durabilité maximale. Idéal pour le marquage personnalisé.',
        categoryId: tShirtsCat.id,
        isQuantityPricing: true,
        metadata: { composition: '90% coton, 10% polyester', grammage: '180g/m²' },
      }).$returningId();

      await db.insert(variants).values([
        { productId: product.id, color: 'Noir', size: 'S', price: '1200.00', stock: 50, sku: 'TS-CLS-N-S' },
        { productId: product.id, color: 'Noir', size: 'M', price: '1200.00', stock: 80, sku: 'TS-CLS-N-M' },
        { productId: product.id, color: 'Noir', size: 'L', price: '1200.00', stock: 60, sku: 'TS-CLS-N-L' },
        { productId: product.id, color: 'Noir', size: 'XL', price: '1300.00', stock: 40, sku: 'TS-CLS-N-XL' },
        { productId: product.id, color: 'Blanc', size: 'S', price: '1200.00', stock: 45, sku: 'TS-CLS-B-S' },
        { productId: product.id, color: 'Blanc', size: 'M', price: '1200.00', stock: 70, sku: 'TS-CLS-B-M' },
        { productId: product.id, color: 'Blanc', size: 'L', price: '1200.00', stock: 55, sku: 'TS-CLS-B-L' },
        { productId: product.id, color: 'Blanc', size: 'XL', price: '1300.00', stock: 35, sku: 'TS-CLS-B-XL' },
        { productId: product.id, color: 'Rouge', size: 'M', price: '1200.00', stock: 30, sku: 'TS-CLS-R-M' },
        { productId: product.id, color: 'Rouge', size: 'L', price: '1200.00', stock: 25, sku: 'TS-CLS-R-L' },
      ]);

      console.log('✅ Test products created');
    }
  }

  console.log('🎉 Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
