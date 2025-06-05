import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Session } from '../session/session.entity';
import { Campaign } from '../campaign/campaign.entity';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'interactive_fiction',
      synchronize: true, // Shouldn't be used in production
      logging: true,
      entities: [User, Session, Campaign]
     
    }),
  ],
})
export class DatabaseModule {}
