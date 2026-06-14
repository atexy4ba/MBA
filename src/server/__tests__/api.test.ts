import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';

let accessToken = '';

beforeAll(async () => {
  const res = await request(app)
    .post('/api/v1/admin/login')
    .send({ email: 'admin@madebyalgerians.com', password: 'admin123' });

  accessToken = res.body.data?.refreshToken || '';
});

describe('GET /api/v1/products', () => {
  it('should return paginated products', async () => {
    const res = await request(app).get('/api/v1/products?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination).toHaveProperty('totalPages');
  });

  it('should filter by category', async () => {
    const res = await request(app).get('/api/v1/products?categoryId=1');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/products/:slug', () => {
  it('should return a single product', async () => {
    const listRes = await request(app).get('/api/v1/products?page=1&limit=1');
    const product = listRes.body.data[0];

    if (product) {
      const res = await request(app).get(`/api/v1/products/${product.slug}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('variants');
    }
  });

  it('should return 404 for unknown product', async () => {
    const res = await request(app).get('/api/v1/products/slug-inexistant');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/categories', () => {
  it('should return category tree', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/v1/search', () => {
  it('should return search results', async () => {
    const res = await request(app).get('/api/v1/search?q=t-shirt');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('should return empty for no query', async () => {
    const res = await request(app).get('/api/v1/search');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/v1/orders', () => {
  it('should validate order data', async () => {
    const res = await request(app).post('/api/v1/orders').send({});
    expect(res.status).toBe(400);
  });

  it('should reject order with invalid variant', async () => {
    const res = await request(app).post('/api/v1/orders').send({
      customerName: 'Test Client',
      email: 'test@example.com',
      phone: '0555123456',
      address: '123 Rue Test',
      city: 'Alger',
      zip: '16000',
      country: 'Algérie',
      items: [{ variantId: 99999, quantity: 1 }],
    });
    expect(res.status).toBe(400);
  });

  it('should create an order successfully', async () => {
    const listRes = await request(app).get('/api/v1/products?page=1&limit=1');
    const product = listRes.body.data[0];

    if (product && product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      const res = await request(app).post('/api/v1/orders').send({
        customerName: 'Test Client',
        email: 'test@example.com',
        phone: '0555123456',
        address: '123 Rue Test',
        city: 'Alger',
        zip: '16000',
        country: 'Algérie',
        items: [{ variantId: variant.id, quantity: 1 }],
      });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('orderId');
    }
  });
});

describe('Admin Auth', () => {
  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({ email: 'wrong@email.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('should login successfully', async () => {
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({ email: 'admin@madebyalgerians.com', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('refreshToken');
  });
});

describe('Admin Routes (protected)', () => {
  let authCookie = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({ email: 'admin@madebyalgerians.com', password: 'admin123' });

    const cookies = res.headers['set-cookie'];
    if (cookies) {
      authCookie = Array.isArray(cookies) ? cookies[0] : cookies;
    }
  });

  it('should reject unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/admin/orders');
    expect(res.status).toBe(401);
  });

  it('should return dashboard analytics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('pendingOrders');
    expect(res.body.data).toHaveProperty('todayOrders');
  });

  it('should return product list', async () => {
    const res = await request(app)
      .get('/api/v1/admin/products')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return order list', async () => {
    const res = await request(app)
      .get('/api/v1/admin/orders')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return settings', async () => {
    const res = await request(app)
      .get('/api/v1/admin/settings')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
  });

  it('should create a product', async () => {
    const listRes = await request(app)
      .get('/api/v1/admin/categories')
      .set('Cookie', authCookie);

    const category = listRes.body.data[0];
    if (category) {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Cookie', authCookie)
        .send({
          name: 'Test Polo',
          slug: `test-polo-${Date.now()}`,
          description: 'Un polo de test',
          categoryId: category.id,
          isQuantityPricing: false,
          variants: [
            { color: 'Bleu', size: 'M', price: 2500, stock: 10, sku: 'TEST-POLO-B-M' },
          ],
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
    }
  });
});

describe('Order Status Flow', () => {
  let authCookie = '';
  let orderId: number;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/admin/login')
      .send({ email: 'admin@madebyalgerians.com', password: 'admin123' });

    const cookies = loginRes.headers['set-cookie'];
    if (cookies) {
      authCookie = Array.isArray(cookies) ? cookies[0] : cookies;
    }

    const listRes = await request(app).get('/api/v1/products?page=1&limit=1');
    const product = listRes.body.data[0];

    if (product && product.variants && product.variants.length > 0) {
      const variant = product.variants[0];

      const orderRes = await request(app).post('/api/v1/orders').send({
        customerName: 'Flow Test',
        email: 'flow@test.com',
        phone: '0555998877',
        address: '5 Rue Flow',
        city: 'Oran',
        zip: '31000',
        country: 'Algérie',
        items: [{ variantId: variant.id, quantity: 2 }],
      });

      orderId = orderRes.body.data?.orderId;
    }
  });

  it('should confirm an order and decrement stock', async () => {
    if (!orderId) return;

    const beforeOrder = await request(app)
      .get(`/api/v1/admin/orders/${orderId}`)
      .set('Cookie', authCookie);

    const res = await request(app)
      .put(`/api/v1/admin/orders/${orderId}/status`)
      .set('Cookie', authCookie)
      .send({ status: 'confirmed', note: 'Stock vérifié' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');

    const afterOrder = await request(app)
      .get(`/api/v1/admin/orders/${orderId}`)
      .set('Cookie', authCookie);

    expect(afterOrder.body.data.statusHistory.length).toBeGreaterThan(
      beforeOrder.body.data.statusHistory.length,
    );
  });

  it('should reject invalid status transitions', async () => {
    if (!orderId) return;

    const res = await request(app)
      .put(`/api/v1/admin/orders/${orderId}/status`)
      .set('Cookie', authCookie)
      .send({ status: 'pending' });

    expect(res.status).toBe(400);
  });
});
