import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Products e2e (update with images)', () => {
  let app: INestApplication;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a product with images', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .send({
        title: 'Test Product',
        slug: 'test-product',
        price: 100,
        stock: 10,
        gender: 'unisex',
        sizes: ['M'],
        images: ['img1.jpg', 'img2.jpg']
      })
      .expect(201);
    productId = res.body.id;
    const urls = res.body.images.map((img: any) => img.url);
    expect(urls).toEqual(expect.arrayContaining(['img1.jpg', 'img2.jpg']));
  });

  
  it('should update product and replace images', async () => {
    console.log('Updating product with ID:', productId);
    const res = await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .send({
        title: 'Updated Product',
        images: ['img3.jpg', 'img4.jpg']
      })
      .expect(200);
    expect(res.body.title).toBe('Updated Product');
    expect(res.body.images.map((img: any) => img.url)).toEqual(['img3.jpg', 'img4.jpg']);
  });

  it('should only have new images in DB', async () => {
    const res = await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .expect(200);
    expect(res.body.images.map((img: any) => img.url)).toEqual(['img3.jpg', 'img4.jpg']);
  });
});
