import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';
import { User, UserRole } from '../user/user.entity';
import { Session } from '../session/session.entity';
import { FileStorageService } from './file-storage.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
    private readonly fileStorage: FileStorageService,
  ) {}

  async create(
    name: string,
    description: string,
    map_details: any,
    master: User,
    model_path?: string,
    is_public = true,
    password?: string,
  ): Promise<Campaign> {
    if (master.role !== UserRole.MASTER) {
      throw new UnauthorizedException('Only Masters can create campaigns.');
    }
    const password_hash = password ? await bcrypt.hash(password, 10) : undefined;
    const join_token = is_public ? undefined : randomBytes(16).toString('hex');
    const newCampaign = this.campaignsRepository.create({
      name,
      description,
      map_details,
      model_path,
      is_public,
      password_hash,
      join_token,
      master_id: master.id,
      master,
    });
    return this.campaignsRepository.save(newCampaign);
  }

  async findAllForUser(user: User): Promise<Campaign[]> {
    if (user.role === UserRole.MASTER) {
      // Masters see their own campaigns plus other public ones
      return this.campaignsRepository.find({
        where: [
          { master_id: user.id },
          { is_public: true },
        ],
        relations: ['master'],
      });
    }

    // Players should see public campaigns as well as private campaigns
    // for sessions they are actively participating in
    const qb = this.campaignsRepository
      .createQueryBuilder('campaign')
      .leftJoin('campaign.master', 'master')
      .leftJoin('session', 'session', 'session.campaign_id = campaign.id')
      .leftJoin('session_players', 'sp', 'sp.session_id = session.id')
      .where('campaign.is_public = true')
      .orWhere('sp.user_id = :userId', { userId: user.id })
      .select(['campaign.id', 'campaign.name', 'campaign.description',
        'campaign.map_details', 'campaign.model_path', 'campaign.is_public',
        'campaign.password_hash', 'campaign.join_token',
        'campaign.master_id', 'master.id', 'master.username', 'master.role']);

    return qb.getMany();
  }

  async findOne(id: number): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({ where: { id }, relations: ['master'] });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found.`);
    }
    return campaign;
  }

  async update(
    id: number,
    name: string,
    description: string,
    map_details: any,
    user: User,
    model_path?: string,
    is_public = true,
    password?: string,
  ): Promise<Campaign> {
    const campaign = await this.findOne(id);
    if (campaign.master_id !== user.id || user.role !== UserRole.MASTER) {
      throw new UnauthorizedException('You are not authorized to update this campaign.');
    }
    campaign.name = name;
    campaign.description = description;
    campaign.map_details = map_details;
    campaign.is_public = is_public;
    if (password !== undefined) {
      campaign.password_hash = password
        ? await bcrypt.hash(password, 10)
        : undefined;
      if (!is_public && !campaign.join_token) {
        campaign.join_token = randomBytes(16).toString('hex');
      }
    }
    if (model_path) {
      campaign.model_path = model_path;
    }
    return this.campaignsRepository.save(campaign);
  }

  async remove(id: number, user: User): Promise<void> {
    const campaign = await this.findOne(id);
    if (campaign.master_id !== user.id || user.role !== UserRole.MASTER) {
      throw new UnauthorizedException('You are not authorized to delete this campaign.');
    }
    await this.fileStorage.deleteModel(campaign.model_path);
    await this.campaignsRepository.delete(id);
  }
}
