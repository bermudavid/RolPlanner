import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './campaign.entity';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { FileStorageService } from './file-storage.service';
import { UserModule } from '../user/user.module'; // Import UserModule for user context

@Module({
  imports: [TypeOrmModule.forFeature([Campaign]), UserModule], // UserModule might be needed for auth checks
  providers: [CampaignService, FileStorageService],
  controllers: [CampaignController],
  exports: [CampaignService],
})
export class CampaignModule {}
