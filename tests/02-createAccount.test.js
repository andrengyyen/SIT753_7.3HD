// tests/01-createAccount.test.js
const request = require('supertest');
const { app, users, db } = require('../index');

describe('POST /createAccount', () => {
  beforeEach(() => {
    users.length = 0;
  });

  afterAll(() => {
    if (db) db.close();
  });

  it('should create a new account successfully', async () => {
    const response = await request(app)
      .post('/createAccount')
      .send({
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      })
      .expect(200);
    expect(response.body.message).toBe('Account created successfully!');
  }, 10000);

  it('should return 400 for duplicate username', async () => {
    users.push({ username: 'testuser', email: 'other@example.com' });
    const response = await request(app)
      .post('/createAccount')
      .send({
        username: 'testuser',
        password: 'password123',
        email: 'new@example.com',
      })
      .expect(400);
    expect(response.body.message).toBe('Username or email is already taken.');
  });

  it('should return 400 for missing fields', async () => {
    const response = await request(app)
      .post('/createAccount')
      .send({ username: 'testuser' })
      .expect(400);
    expect(response.body.message).toBe('Invalid account data.');
  });
});