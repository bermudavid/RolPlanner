import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
// App type was imported from supertest/types, but it's not directly used in the provided snippet for app: INestApplication.
// INestApplication itself doesn't need a generic type argument if we are not using specific methods from App that require it.
// For simplicity and to match the new snippet more closely, I'll remove <App> from INestApplication if it's not strictly needed.
// However, the original file has `app: INestApplication<App>;`. Let's try to keep it if possible or simplify.
// The new snippet uses `app: INestApplication;`
// Let's stick to `app: INestApplication;` for consistency with the new tests.
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './../src/user/user.entity'; // Ensure this path is correct
import { Repository } from 'typeorm';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/') // Adjusted to account for the global 'api' prefix
      .expect(200)
      .expect('Hello World!'); // Assuming AppService still returns this
  });

  afterAll(async () => {
    await app.close(); // Ensure app is closed for this suite too
  });
});

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  const uniqueUsername = `testuser_${Date.now()}`;
  const password = 'password123';
  // For some reason, the original test used uniqueUsername_dup, but this was not defined, so I'm defining it here.
  const uniqueUsernameDup = `${uniqueUsername}_dup`;
  const uniqueUsernameLogin = `${uniqueUsername}_login`;


  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule], // AppModule should import UserModule, AuthModule etc.
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api'); // Crucial for API endpoint testing
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    // Clean up created users
    // Order of deletion might matter if there are foreign key constraints, but not for these specific entities.
    await userRepository.delete({ username: uniqueUsername });
    await userRepository.delete({ username: uniqueUsernameDup });
    await userRepository.delete({ username: uniqueUsernameLogin });
    await app.close();
  });

  // Optional: Clear users table before each specific test if needed, or handle cleanup carefully
  // For this setup, unique names and afterAll should be sufficient.
  // beforeEach(async () => {
    // await userRepository.delete({ username: uniqueUsername });
    // await userRepository.delete({ username: uniqueUsernameDup });
  // });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: uniqueUsername, password: password, role: 'Player' })
        .expect(201)
        .then(response => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.username).toEqual(uniqueUsername);
          expect(response.body.role).toEqual('Player');
          // Optionally, check if password is not returned
          expect(response.body).not.toHaveProperty('password');
        });
    });

    it('should fail to register a user with a duplicate username', async () => {
      // First, create a user that will cause the duplicate error
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: uniqueUsernameDup, password: password, role: 'Master' })
        .expect(201); // Expect successful creation of this user first

      // Then, attempt to register again with the same username
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: uniqueUsernameDup, password: password, role: 'Player' })
        .expect(500); // Expecting 500 for unhandled unique constraint violation.
                      // A well-implemented backend might return 409 (Conflict).
    });

    it('should fail to register a user with invalid data (e.g., missing username)', async () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ password: password, role: 'Player' }) // Missing username
          .expect(400); // Bad Request, due to validation pipes
    });

    it('should fail to register a user with invalid role', async () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ username: `${uniqueUsername}_invalidrole`, password: password, role: 'InvalidRole' })
          .expect(400); // Bad Request, due to validation (if role is an enum and validated)
    });
  });

  describe('/auth/login (POST)', () => {
    beforeAll(async () => {
      // Ensure the user for login tests exists
      // Clean before creating to ensure idempotency if tests are run multiple times or out of order
      await userRepository.delete({ username: uniqueUsernameLogin });
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: uniqueUsernameLogin, password: password, role: 'Player' })
        .expect(201);
    });

    // afterAll for this inner describe is not strictly necessary if the main afterAll cleans up uniqueUsernameLogin
    // However, if we wanted to scope cleanup more tightly:
    // afterAll(async () => {
    //     await userRepository.delete({ username: uniqueUsernameLogin });
    // });

    it('should login an existing user successfully and return a JWT', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: uniqueUsernameLogin, password: password })
        .expect(201) // As per AuthController's @Post and @HttpCode(201) for login
        .then(response => {
          expect(response.body).toHaveProperty('access_token');
          expect(response.body.access_token).toBeTruthy(); // Token should not be empty
        });
    });

    it('should fail to login with incorrect password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: uniqueUsernameLogin, password: 'wrongpassword' })
        .expect(401); // Unauthorized
    });

    it('should fail to login with missing username', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: password })
        .expect(400); // Validation error
    });

    it('should fail to login with missing password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: uniqueUsernameLogin })
        .expect(400); // Validation error
    });

    it('should fail to login with non-existent username', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: `nonexistentuser_${Date.now()}`, password: password })
        .expect(401); // Unauthorized
    });
  });
});
