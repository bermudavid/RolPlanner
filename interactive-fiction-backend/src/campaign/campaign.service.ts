import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';
import { User, UserRole } from '../user/user.entity';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
  ) {}

  async create(name: string, description: string, map_details: any, master: User): Promise<Campaign> {
    if (master.role !== UserRole.MASTER) {
      throw new UnauthorizedException('Only Masters can create campaigns.');
    }
    const newCampaign = this.campaignsRepository.create({
      name,
      description,
      map_details,
      master_id: master.id,
      master, // Store the user object as well for easier access if needed
    });
    return this.campaignsRepository.save(newCampaign);
  }

  async findAll(): Promise<Campaign[]> {
    return this.campaignsRepository.find({ relations: ['master'] });
  }

  async findOne(id: number): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({ where: { id }, relations: ['master'] });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found.`);
    }
    return campaign;
  }

  async update(id: number, name: string, description: string, map_details: any, user: User): Promise<Campaign> {
    const campaign = await this.findOne(id);
    if (campaign.master_id !== user.id || user.role !== UserRole.MASTER) {
      throw new UnauthorizedException('You are not authorized to update this campaign.');
    }
    campaign.name = name;
    campaign.description = description;
    campaign.map_details = map_details;
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
