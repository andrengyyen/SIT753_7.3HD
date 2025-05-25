// tests/setup.js
jest.mock('sqlite3', () => ({
    verbose: () => ({
      Database: jest.fn().mockImplementation(() => ({
        serialize: jest.fn((cb) => cb()),
        run: jest.fn((query, params, cb) => cb && cb()),
        all: jest.fn((query, cb) => {
          if (query.includes('SELECT * FROM User')) {
            return cb(null, [
              {
                username: 'predefinedUser',
                password: 'hashedPassword', // Mocked hashed password
                email: 'user@example.com',
              },
            ]);
          }
          return cb(null, []);
        }),
        close: jest.fn(),
      })),
    }),
  }));
  
  jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn().mockImplementation((plain, hash) => Promise.resolve(plain === 'password123' && hash === 'hashedPassword')),
  }));