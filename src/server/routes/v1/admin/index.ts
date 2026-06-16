import { Router, Request, Response, NextFunction } from 'express';
import { db, schema } from '../../../db';
import { eq, and, desc, asc, sql, like, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AppError } from '../../../middleware/errorHandler';
import { authenticate, requireAdmin, JwtPayload } from '../../../middleware/auth';
import { loginLimiter } from '../../../middleware/rateLimit';
import crypto from 'crypto';

export const adminRoutes = Router();

function generateTokens(userId: number, role: 'admin' | 'customer') {
  const accessToken = jwt.sign(
    { userId, role } satisfies JwtPayload,
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: '15m' as any },
  );
  const refreshToken = crypto.randomBytes(48).toString('hex');
  return { accessToken, refreshToken };
}

// --- Auth ---
adminRoutes.post('/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }).parse(req.body);

    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou mot de passe incorrect.');
    }

    if (user.role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Accès réservé aux administrateurs.');
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await db.insert(schema.refreshTokens).values({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.json({ data: { refreshToken } });
  } catch (err) {
    next(err);
  }
});

adminRoutes.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

    const [stored] = await db.select().from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.token, refreshToken));

    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token invalide ou expiré.');
    }

    await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.id, stored.id));

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, stored.userId));
    if (!user) {
      throw new AppError(401, 'USER_NOT_FOUND', 'Utilisateur introuvable.');
    }

    const tokens = generateTokens(user.id, user.role);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await db.insert(schema.refreshTokens).values({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt,
    });

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.json({ data: { refreshToken: tokens.refreshToken } });
  } catch (err) {
    next(err);
  }
});

// All routes below require admin auth
adminRoutes.use(authenticate, requireAdmin);

adminRoutes.get('/me', async (req: Request, res: Response, _next: NextFunction) => {
  res.json({ data: { userId: req.user!.userId, role: req.user!.role } });
});

// --- Dashboard Analytics ---
adminRoutes.get('/analytics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [orderCount] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.orders).where(eq(schema.orders.status, 'pending'));

    const [todayCount] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.orders)
      .where(sql`DATE(${schema.orders.createdAt}) = CURDATE()`);

    const [revenueResult] = await db.select({
      total: sql<number>`COALESCE(SUM(${schema.orderItems.unitPrice} * ${schema.orderItems.quantity}), 0)`,
    })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
      .where(eq(schema.orders.status, 'delivered'));

    const recentOrders = await db.select({
      id: schema.orders.id,
      customerName: schema.orders.customerName,
      status: schema.orders.status,
      createdAt: schema.orders.createdAt,
    })
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt))
      .limit(10);

    const lowStockVariants = await db.select({
      id: schema.variants.id,
      productId: schema.variants.productId,
      color: schema.variants.color,
      size: schema.variants.size,
      stock: schema.variants.stock,
      productName: schema.products.name,
    })
      .from(schema.variants)
      .innerJoin(schema.products, eq(schema.products.id, schema.variants.productId))
      .where(sql`${schema.variants.stock} < 5 AND ${schema.variants.stock} > 0`)
      .limit(10);

    const [stockOutCount] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.variants)
      .where(eq(schema.variants.stock, 0));

    res.json({
      data: {
        pendingOrders: Number(orderCount?.count ?? 0),
        todayOrders: Number(todayCount?.count ?? 0),
        totalRevenue: Number(revenueResult?.total ?? 0),
        outOfStock: Number(stockOutCount?.count ?? 0),
        recentOrders,
        lowStockVariants,
      },
    });
  } catch (err) {
    next(err);
  }
});

// --- Products ---
adminRoutes.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const search = (req.query.search as string) || '';
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const statusParam = (req.query.status as string) || undefined;

    const conditions = [];
    if (search) {
      conditions.push(or(like(schema.products.name, `%${search}%`), like(schema.products.description, `%${search}%`))!);
    }
    if (categoryId) {
      conditions.push(eq(schema.products.categoryId, categoryId));
    }
    if (statusParam) {
      conditions.push(eq(schema.products.status, statusParam as 'active' | 'archived'));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, products] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.products).where(where),
      db.select().from(schema.products).where(where)
        .orderBy(desc(schema.products.createdAt))
        .limit(limit).offset((page - 1) * limit),
    ]);

    res.json({
      data: products,
      pagination: { page, limit, total: Number(countResult[0]?.count ?? 0) },
    });
  } catch (err) {
    next(err);
  }
});

adminRoutes.post('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productSchema = z.object({
      name: z.string().min(2),
      slug: z.string().min(2),
      description: z.string().min(1),
      categoryId: z.number().int().positive(),
      isQuantityPricing: z.boolean().default(false),
      metadata: z.record(z.string(), z.unknown()).optional(),
      variants: z.array(z.object({
        color: z.string().min(1),
        size: z.string().min(1),
        price: z.number().positive(),
        stock: z.number().int().min(0),
        sku: z.string().min(1),
        imageUrl: z.string().optional(),
      })).min(1),
      pricingTiers: z.array(z.object({
        minQuantity: z.number().int().positive(),
        price: z.number().positive(),
      })).optional(),
    });

    const body = productSchema.parse(req.body);

    const result = await db.transaction(async (tx) => {
      const [product] = await tx.insert(schema.products).values({
        name: body.name,
        slug: body.slug,
        description: body.description,
        categoryId: body.categoryId,
        isQuantityPricing: body.isQuantityPricing,
        metadata: (body.metadata as any) ?? {},
      }).$returningId();

      for (const v of body.variants) {
        await tx.insert(schema.variants).values({
          productId: product.id,
          color: v.color,
          size: v.size,
          price: v.price.toString(),
          stock: v.stock,
          sku: v.sku,
          imageUrl: v.imageUrl ?? null,
        });
      }

      if (body.isQuantityPricing && body.pricingTiers) {
        for (const t of body.pricingTiers) {
          await tx.insert(schema.pricingTiers).values({
            productId: product.id,
            minQuantity: t.minQuantity,
            price: t.price.toString(),
          });
        }
      }

      return product;
    });

    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

adminRoutes.put('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    const productSchema = z.object({
      name: z.string().min(2).optional(),
      slug: z.string().min(2).optional(),
      description: z.string().optional(),
      categoryId: z.number().int().positive().optional(),
      isQuantityPricing: z.boolean().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      variants: z.array(z.object({
        id: z.number().optional(),
        color: z.string().min(1),
        size: z.string().min(1),
        price: z.number().positive(),
        stock: z.number().int().min(0),
        sku: z.string().min(1),
        imageUrl: z.string().optional(),
      })).optional(),
      pricingTiers: z.array(z.object({
        minQuantity: z.number().int().positive(),
        price: z.number().positive(),
      })).optional(),
    });

    const body = productSchema.parse(req.body);

    await db.transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
      if (body.isQuantityPricing !== undefined) updateData.isQuantityPricing = body.isQuantityPricing;
      if (body.metadata !== undefined) updateData.metadata = body.metadata;

      if (Object.keys(updateData).length > 0) {
        await tx.update(schema.products).set(updateData as any).where(eq(schema.products.id, id));
      }

      if (body.variants) {
        const existingIds = body.variants.filter((v) => v.id).map((v) => v.id!);
        if (existingIds.length === 0) {
          await tx.delete(schema.variants).where(eq(schema.variants.productId, id));
        } else {
          await tx.delete(schema.variants).where(
            and(eq(schema.variants.productId, id), sql`${schema.variants.id} NOT IN (${existingIds.join(',')})`),
          );
        }

        for (const v of body.variants) {
          if (v.id) {
            await tx.update(schema.variants).set({
              color: v.color,
              size: v.size,
              price: v.price.toString(),
              stock: v.stock,
              sku: v.sku,
              imageUrl: v.imageUrl ?? null,
            }).where(eq(schema.variants.id, v.id));
          } else {
            await tx.insert(schema.variants).values({
              productId: id,
              color: v.color,
              size: v.size,
              price: v.price.toString(),
              stock: v.stock,
              sku: v.sku,
              imageUrl: v.imageUrl ?? null,
            });
          }
        }
      }

      if (body.pricingTiers !== undefined) {
        await tx.delete(schema.pricingTiers).where(eq(schema.pricingTiers.productId, id));
        for (const t of body.pricingTiers) {
          await tx.insert(schema.pricingTiers).values({
            productId: id,
            minQuantity: t.minQuantity,
            price: t.price.toString(),
          });
        }
      }
    });

    res.json({ data: { id } });
  } catch (err) {
    next(err);
  }
});

adminRoutes.delete('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await db.update(schema.products)
      .set({ status: 'archived' })
      .where(eq(schema.products.id, id));
    res.json({ data: { id } });
  } catch (err) {
    next(err);
  }
});

// --- Categories ---
adminRoutes.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const all = await db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder));
    res.json({ data: all });
  } catch (err) {
    next(err);
  }
});

adminRoutes.post('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categorySchema = z.object({
      name: z.string().min(2),
      slug: z.string().min(2),
      parentId: z.number().int().positive().nullable().optional(),
      imageUrl: z.string().optional(),
      sortOrder: z.number().int().default(0),
    });

    const body = categorySchema.parse(req.body);
    const [category] = await db.insert(schema.categories).values({
      name: body.name,
      slug: body.slug,
      parentId: body.parentId ?? null,
      imageUrl: body.imageUrl ?? null,
      sortOrder: body.sortOrder,
    }).$returningId();

    res.status(201).json({ data: category });
  } catch (err) {
    next(err);
  }
});

adminRoutes.put('/categories/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const categorySchema = z.object({
      name: z.string().min(2).optional(),
      slug: z.string().min(2).optional(),
      parentId: z.number().int().positive().nullable().optional(),
      imageUrl: z.string().optional(),
      sortOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
    });

    const body = categorySchema.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.parentId !== undefined) updateData.parentId = body.parentId;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    await db.update(schema.categories).set(updateData as any).where(eq(schema.categories.id, id));
    res.json({ data: { id } });
  } catch (err) {
    next(err);
  }
});

adminRoutes.delete('/categories/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    const [productCount] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.products).where(eq(schema.products.categoryId, id));

    if (Number(productCount?.count ?? 0) > 0) {
      throw new AppError(400, 'CATEGORY_HAS_PRODUCTS', 'Impossible de supprimer une catégorie contenant des produits.');
    }

    await db.update(schema.categories).set({ isActive: false }).where(eq(schema.categories.id, id));
    res.json({ data: { id } });
  } catch (err) {
    next(err);
  }
});

// --- Orders ---
adminRoutes.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || '';
    const dateFrom = req.query.dateFrom as string || undefined;
    const dateTo = req.query.dateTo as string || undefined;

    const conditions = [];
    if (status) {
      conditions.push(eq(schema.orders.status, status as any));
    }
    if (search) {
      conditions.push(or(
        like(schema.orders.customerName, `%${search}%`),
        like(schema.orders.email, `%${search}%`),
      )!);
    }
    if (dateFrom) {
      conditions.push(sql`DATE(${schema.orders.createdAt}) >= ${dateFrom}`);
    }
    if (dateTo) {
      conditions.push(sql`DATE(${schema.orders.createdAt}) <= ${dateTo}`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, orders] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.orders).where(where),
      db.select().from(schema.orders).where(where)
        .orderBy(desc(schema.orders.createdAt))
        .limit(limit).offset((page - 1) * limit),
    ]);

    res.json({
      data: orders,
      pagination: { page, limit, total: Number(countResult[0]?.count ?? 0) },
    });
  } catch (err) {
    next(err);
  }
});

adminRoutes.get('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Commande introuvable.');
    }

    const [items, statusHistory] = await Promise.all([
      db.select({
        id: schema.orderItems.id,
        variantId: schema.orderItems.variantId,
        productId: schema.orderItems.productId,
        quantity: schema.orderItems.quantity,
        unitPrice: schema.orderItems.unitPrice,
        productName: schema.products.name,
        productSlug: schema.products.slug,
        color: schema.variants.color,
        size: schema.variants.size,
        sku: schema.variants.sku,
      })
        .from(schema.orderItems)
        .innerJoin(schema.products, eq(schema.products.id, schema.orderItems.productId))
        .innerJoin(schema.variants, eq(schema.variants.id, schema.orderItems.variantId))
        .where(eq(schema.orderItems.orderId, id)),
      db.select().from(schema.orderStatusHistory)
        .where(eq(schema.orderStatusHistory.orderId, id))
        .orderBy(desc(schema.orderStatusHistory.createdAt)),
    ]);

    res.json({ data: { ...order, items, statusHistory } });
  } catch (err) {
    next(err);
  }
});

adminRoutes.put('/orders/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const statusSchema = z.object({
      status: z.enum(['confirmed', 'shipped', 'delivered', 'cancelled']),
      note: z.string().optional(),
    });

    const body = statusSchema.parse(req.body);

    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Commande introuvable.');
    }

    const currentStatus = order.status as string;

    if (currentStatus === 'shipped' || currentStatus === 'delivered') {
      throw new AppError(400, 'INVALID_STATUS', `Impossible de changer le statut depuis "${currentStatus}".`);
    }

    if (body.status === 'delivered' && currentStatus !== 'shipped') {
      throw new AppError(400, 'INVALID_STATUS', 'La commande doit être expédiée avant d\'être livrée.');
    }

    if (body.status === 'cancelled' && (currentStatus === 'shipped' || currentStatus === 'delivered')) {
      throw new AppError(400, 'INVALID_STATUS', 'Impossible d\'annuler une commande expédiée ou livrée.');
    }

    await db.transaction(async (tx) => {
      await tx.update(schema.orders).set({ status: body.status }).where(eq(schema.orders.id, id));

      await tx.insert(schema.orderStatusHistory).values({
        orderId: id,
        status: body.status,
        note: body.note ?? null,
        changedBy: 'admin',
      });

      if (body.status === 'confirmed') {
        const items = await tx.select().from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, id));

        for (const item of items) {
          await tx.update(schema.variants)
            .set({ stock: sql`${schema.variants.stock} - ${item.quantity}` })
            .where(eq(schema.variants.id, item.variantId));
        }
      }
    });

    res.json({ data: { id, status: body.status } });
  } catch (err) {
    next(err);
  }
});

// --- Settings ---
adminRoutes.get('/settings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [settings, formFields] = await Promise.all([
      db.select().from(schema.storeSettings),
      db.select().from(schema.orderFormFields)
        .where(eq(schema.orderFormFields.isActive, true))
        .orderBy(asc(schema.orderFormFields.sortOrder)),
    ]);

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    res.json({ data: { settings: settingsMap, orderFormFields: formFields } });
  } catch (err) {
    next(err);
  }
});

adminRoutes.put('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, string>;

    await db.transaction(async (tx) => {
      for (const [key, value] of Object.entries(body)) {
        const [existing] = await tx.select().from(schema.storeSettings)
          .where(eq(schema.storeSettings.key, key));

        if (existing) {
          await tx.update(schema.storeSettings).set({ value })
            .where(eq(schema.storeSettings.id, existing.id));
        } else {
          await tx.insert(schema.storeSettings).values({ key, value });
        }
      }
    });

    res.json({ data: { updated: true } });
  } catch (err) {
    next(err);
  }
});
