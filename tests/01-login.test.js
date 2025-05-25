// tests/02-login.test.js
const request = require('supertest');
const { app, users, db } = require('../index');
const bcrypt = require('bcrypt');

describe('POST /login', () => {
  beforeEach(() => {
    users.length = 0;
    jest.clearAllMocks();
  });

  it('should login successfully', async () => {
    users.push({ username: 'testuser', password: 'hashedPassword', email: 'test@example.com' });
    bcrypt.compare.mockImplementation((pass, hash, callback) => callback(null, true));

    const response = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'testpass' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login successful!');
    expect(response.body.username).toBe('testuser');
  });

  it('should return 400 if user not found', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'testpass' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid username or password.');
  });

  it('should return 400 if password incorrect', async () => {
    users.push({ username: 'testuser', password: 'hashedPassword', email: 'test@example.com' });
    bcrypt.compare.mockImplementation((pass, hash, callback) => callback(null, false));

    const response = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'wrongpass' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid username or password.');
  });

  it('should return 500 if bcrypt error', async () => {
    users.push({ username: 'testuser', password: 'hashedPassword', email: 'test@example.com' });
    bcrypt.compare.mockImplementation((pass, hash, callback) => callback(new Error('Bcrypt error')));

    const response = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'testpass' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Error processing login.');
  });
});