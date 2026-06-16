import { Router, Request, Response, NextFunction } from 'express';
import { db, schema } from '../../../db';
import { eq, and, like, or, gte, lte, asc, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { AppError } from '../../../middleware/errorHandler';
import { sendNewOrderNotification } from '../../../services/email';

export const publicRoutes = Router();

// GET /api/v1
publicRoutes.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Made by Algerians API',
    version: '1.0.0',
    endpoints: {
      products: '/api/v1/products',
      categories: '/api/v1/categories',
      search: '/api/v1/search',
      orders: 'POST /api/v1/orders',
    },
  });
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

const orderFormSchema = z.object({
  customerName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(6, 'Téléphone requis'),
  address: z.string().min(5, 'Adresse requise'),
  city: z.string().min(2, 'Ville requise'),
  zip: z.string().min(2, 'Code postal requis'),
  country: z.string().default('Algérie'),
  notes: z.string().optional(),
  items: z.array(z.object({
    variantId: z.number().int().positive(),
    quantity: z.number().int().positive().max(100),
  })).min(1, 'Au moins un produit requis'),
});

type ProductRow = typeof schema.products.$inferSelect;
type VariantRow = typeof schema.variants.$inferSelect;

// GET /api/v1/products
publicRoutes.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const sort = (req.query.sort as string) || 'createdAt_desc';

    const conditions = [eq(schema.products.status, 'active')];

    if (categoryId) {
      conditions.push(eq(schema.products.categoryId, categoryId));
    }

    const offset = (page - 1) * limit;

    const productsQuery = db.select({
      id: schema.products.id,
      name: schema.products.name,
      slug: schema.products.slug,
      categoryId: schema.products.categoryId,
      isQuantityPricing: schema.products.isQuantityPricing,
      metadata: schema.products.metadata,
      createdAt: schema.products.createdAt,
    })
      .from(schema.products)
      .where(and(...conditions));

    if (minPrice !== undefined || maxPrice !== undefined) {
      productsQuery.innerJoin(schema.variants, eq(schema.products.id, schema.variants.productId));
      productsQuery.groupBy(schema.products.id);
      if (minPrice !== undefined) {
        productsQuery.having(gte(sql`MIN(${schema.variants.price})`, minPrice.toString()));
      }
      if (maxPrice !== undefined) {
        productsQuery.having(lte(sql`MAX(${schema.variants.price})`, maxPrice.toString()));
      }
    }

    switch (sort) {
      case 'price_asc':
        productsQuery.innerJoin(schema.variants, eq(schema.products.id, schema.variants.productId));
        productsQuery.groupBy(schema.products.id);
        productsQuery.orderBy(asc(sql`MIN(${schema.variants.price})`));
        break;
      case 'price_desc':
        productsQuery.innerJoin(schema.variants, eq(schema.products.id, schema.variants.productId));
        productsQuery.groupBy(schema.products.id);
        productsQuery.orderBy(desc(sql`MIN(${schema.variants.price})`));
        break;
      case 'name_asc':
        productsQuery.orderBy(asc(schema.products.name));
        break;
      default:
        productsQuery.orderBy(desc(schema.products.createdAt));
    }

    const [countResult, products] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.products).where(and(...conditions)),
      productsQuery.limit(limit).offset(offset),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    const productIds = products.map((p: { id: number }) => p.id);

    let productVariants: VariantRow[] = [];
    if (productIds.length > 0) {
      productVariants = await db.select().from(schema.variants)
        .where(sql`${schema.variants.productId} IN (${productIds.join(',')})`);
    }

    const productsWithVariants = products.map((product: { id: number; [key: string]: unknown }) => ({
      ...product,
      variants: productVariants.filter((v) => v.productId === (product.id as number)),
    }));

    res.json({
      data: productsWithVariants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, 'VALIDATION_ERROR', 'Paramètres de pagination invalides.'));
      return;
    }
    next(err);
  }
});

// GET /api/v1/products/:slug
publicRoutes.get('/products/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;

    const [product] = await db.select().from(schema.products)
      .where(and(eq(schema.products.slug, slug), eq(schema.products.status, 'active')));

    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produit introuvable.');
    }

    const variants = await db.select().from(schema.variants)
      .where(eq(schema.variants.productId, product.id));

    const [category] = await db.select({ id: schema.categories.id, name: schema.categories.name, slug: schema.categories.slug })
      .from(schema.categories)
      .where(eq(schema.categories.id, product.categoryId));

    let pricingTiers: (typeof schema.pricingTiers.$inferSelect)[] = [];
    if (product.isQuantityPricing) {
      pricingTiers = await db.select().from(schema.pricingTiers)
        .where(eq(schema.pricingTiers.productId, product.id))
        .orderBy(asc(schema.pricingTiers.minQuantity));
    }

    res.json({
      data: {
        ...product,
        category,
        variants,
        pricingTiers,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/categories
publicRoutes.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const all = await db.select().from(schema.categories)
      .where(eq(schema.categories.isActive, true))
      .orderBy(asc(schema.categories.sortOrder), asc(schema.categories.name));

    const roots = all.filter((c) => c.parentId === null);
    const tree = roots.map((root) => ({
      ...root,
      children: all.filter((c) => c.parentId === root.id),
    }));

    res.json({ data: tree });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/categories/:slug
publicRoutes.get('/categories/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const { page, limit } = paginationSchema.parse(req.query);

    const [category] = await db.select().from(schema.categories)
      .where(eq(schema.categories.slug, slug));

    if (!category) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Catégorie introuvable.');
    }

    const offset = (page - 1) * limit;

    const [countResult, products] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.products)
        .where(and(eq(schema.products.categoryId, category.id), eq(schema.products.status, 'active'))),
      db.select().from(schema.products)
        .where(and(eq(schema.products.categoryId, category.id), eq(schema.products.status, 'active')))
        .orderBy(desc(schema.products.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    const productIds = products.map((p: { id: number }) => p.id);
    let productVariants: VariantRow[] = [];
    if (productIds.length > 0) {
      productVariants = await db.select().from(schema.variants)
        .where(sql`${schema.variants.productId} IN (${productIds.join(',')})`);
    }

    const productsWithVariants = products.map((product: { id: number; [key: string]: unknown }) => ({
      ...product,
      variants: productVariants.filter((v) => v.productId === (product.id as number)),
    }));

    res.json({
      data: { category, products: productsWithVariants },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, 'VALIDATION_ERROR', 'Paramètres invalides.'));
      return;
    }
    next(err);
  }
});

// GET /api/v1/search
publicRoutes.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) || '';
    const { page, limit } = paginationSchema.parse(req.query);
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const maxResults = req.query.maxResults ? Number(req.query.maxResults) : undefined;

    if (!q && !categoryId) {
      res.json({ data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } });
      return;
    }

    const conditions = [eq(schema.products.status, 'active')];

    if (q) {
      conditions.push(or(
        like(schema.products.name, `%${q}%`),
        like(schema.products.description, `%${q}%`),
      )!);
    }

    if (categoryId) {
      conditions.push(eq(schema.products.categoryId, categoryId));
    }

    const resultLimit = maxResults ?? limit;

    const [countResult, products] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.products).where(and(...conditions)),
      db.select().from(schema.products)
        .where(and(...conditions))
        .orderBy(desc(schema.products.createdAt))
        .limit(resultLimit)
        .offset((page - 1) * limit),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    const productIds = products.map((p: { id: number }) => p.id);
    let productVariants: VariantRow[] = [];
    if (productIds.length > 0) {
      productVariants = await db.select().from(schema.variants)
        .where(sql`${schema.variants.productId} IN (${productIds.join(',')})`);
    }

    const productsWithVariants = products.map((product: { id: number; [key: string]: unknown }) => ({
      ...product,
      variants: productVariants.filter((v) => v.productId === (product.id as number)),
    }));

    res.json({
      data: productsWithVariants,
      pagination: { page, limit: resultLimit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/orders
publicRoutes.post('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = orderFormSchema.parse(req.body);

    const result = await db.transaction(async (tx) => {
      let totalAmount = 0;

      for (const item of body.items) {
        const [variant] = await tx.select().from(schema.variants)
          .where(eq(schema.variants.id, item.variantId));

        if (!variant) {
          throw new AppError(400, 'VARIANT_NOT_FOUND', `Variante #${item.variantId} introuvable.`);
        }

        if (variant.stock < item.quantity) {
          throw new AppError(400, 'OUT_OF_STOCK', `Stock insuffisant pour la variante #${item.variantId}.`);
        }

        totalAmount += Number(variant.price) * item.quantity;
      }

      const [order] = await tx.insert(schema.orders).values({
        customerName: body.customerName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        zip: body.zip,
        country: body.country,
        notes: body.notes ?? null,
        status: 'pending',
      }).$returningId();

      for (const item of body.items) {
        const [variant] = await tx.select().from(schema.variants)
          .where(eq(schema.variants.id, item.variantId));

        await tx.insert(schema.orderItems).values({
          orderId: order.id,
          variantId: item.variantId,
          productId: variant!.productId,
          quantity: item.quantity,
          unitPrice: variant!.price,
        });
      }

      await tx.insert(schema.orderStatusHistory).values({
        orderId: order.id,
        status: 'pending',
        note: 'Commande créée',
        changedBy: 'system',
      });

      return { orderId: order.id, total: totalAmount.toFixed(2) };
    });

    sendNewOrderNotification({
      id: result.orderId,
      customerName: body.customerName,
      email: body.email,
      phone: body.phone,
      total: result.total,
    }).catch(console.error);

    res.status(201).json({
      data: { orderId: result.orderId },
      message: 'Commande enregistrée avec succès.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, 'VALIDATION_ERROR', err.issues.map((e) => e.message).join(', ')));
      return;
    }
    next(err);
  }
});
