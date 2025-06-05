import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './../src/user/user.entity';
import { Campaign } from './../src/campaign/campaign.entity';
import { Session } from './../src/session/session.entity';
import { Repository } from 'typeorm';

describe('SessionController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let campaignRepository: Repository<Campaign>;
  let sessionRepository: Repository<Session>;
  const masterUsername = `master_${Date.now()}`;
  const playerUsername = `player_${Date.now()}`;
  const password = 'password123';
  let masterToken: string;
  let playerToken: string;
  let campaignId: number;
  let sessionId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    campaignRepository = moduleFixture.get<Repository<Campaign>>(getRepositoryToken(Campaign));
    sessionRepository = moduleFixture.get<Repository<Session>>(getRepositoryToken(Session));

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ username: masterUsername, password, role: 'Master' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ username: playerUsername, password, role: 'Player' })
      .expect(201);

    const masterRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: masterUsername, password })
      .expect(201);
    masterToken = masterRes.body.access_token;

    const playerRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: playerUsername, password })
      .expect(201);
    playerToken = playerRes.body.access_token;

    const campaignRes = await request(app.getHttpServer())
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ name: 'Test Campaign', description: 'desc' })
      .expect(201);
    campaignId = campaignRes.body.id;
  });

  afterAll(async () => {
    await sessionRepository.delete({});
    await campaignRepository.delete({});
    await userRepository.delete({ username: masterUsername });
    await userRepository.delete({ username: playerUsername });
    await app.close();
  });

  it('allows a Master to create, start and end a session', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/sessions')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ name: 'Session 1', campaign_id: campaignId })
      .expect(201);
    sessionId = createRes.body.id;

    const startRes = await request(app.getHttpServer())
      .patch(`/api/sessions/${sessionId}/start`)
      .set('Authorization', `Bearer ${masterToken}`)
      .expect(200);

    expect(startRes.body.status).toBe('Active');

    const endRes = await request(app.getHttpServer())
      .patch(`/api/sessions/${sessionId}/end`)
      .set('Authorization', `Bearer ${masterToken}`)
      .expect(200);

    expect(endRes.body.status).toBe('Ended');
  });

  it('prevents a Player from creating a session', async () => {
    await request(app.getHttpServer())
      .post('/api/sessions')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ name: 'Invalid', campaign_id: campaignId })
      .expect(403);
  });

  it('prevents a Player from ending a session', async () => {
    await request(app.getHttpServer())
      .patch(`/api/sessions/${sessionId}/end`)
      .set('Authorization', `Bearer ${playerToken}`)
      .expect(403);
  });
});
