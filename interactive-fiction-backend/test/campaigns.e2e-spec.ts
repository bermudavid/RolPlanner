import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './../src/user/user.entity';
import { Campaign } from './../src/campaign/campaign.entity';
import { Repository } from 'typeorm';

describe('CampaignController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let campaignRepository: Repository<Campaign>;
  const masterUsername = `master_${Date.now()}`;
  const playerUsername = `player_${Date.now()}`;
  const password = 'password123';
  let masterToken: string;
  let playerToken: string;
  let campaignId: number;

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
  });

  afterAll(async () => {
    await campaignRepository.delete({});
    await userRepository.delete({ username: masterUsername });
    await userRepository.delete({ username: playerUsername });
    await app.close();
  });

  it('allows a Master to create a campaign', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ name: 'Test Campaign', description: 'desc' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test Campaign');
    campaignId = res.body.id;
  });

  it('allows a Master to update a campaign', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ name: 'Updated Campaign', description: 'desc 2' })
      .expect(200);

    expect(res.body.name).toBe('Updated Campaign');
  });

  it('prevents a Player from creating a campaign', async () => {
    await request(app.getHttpServer())
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ name: 'Bad Campaign', description: 'nope' })
      .expect(403);
  });

  it('prevents a Player from updating a campaign', async () => {
    await request(app.getHttpServer())
      .put(`/api/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ name: 'Bad Update', description: 'nope' })
      .expect(403);
  });
});
