import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './session.entity';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { SessionGateway } from './session.gateway';
import { UserModule } from '../user/user.module';
import { CampaignModule } from '../campaign/campaign.module'; // Import CampaignModule for campaign context

@Module({
  imports: [TypeOrmModule.forFeature([Session]), UserModule, CampaignModule],
  providers: [SessionService, SessionGateway],
  controllers: [SessionController],
  exports: [SessionService, SessionGateway],
})
export class SessionModule {}
