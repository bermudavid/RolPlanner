import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';
import { User, UserRole } from '../user/user.entity';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
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
      return this.campaignsRepository.find({
        where: { master_id: user.id },
        relations: ['master'],
      });
    }
    return this.campaignsRepository.find({
      where: { is_public: true },
      relations: ['master'],
    });
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
    await this.campaignsRepository.delete(id);
  }
}
