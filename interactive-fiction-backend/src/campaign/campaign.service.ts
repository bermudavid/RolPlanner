import { Injectable, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';
import { User, UserRole } from '../user/user.entity';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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
    return this.campaignsRepository.find({ relations: ['master', 'players'] });
  }

  async findOne(id: number): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({ where: { id }, relations: ['master', 'players'] });
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

  async joinCampaign(campaignId: number, userId: number): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({ where: { id: campaignId }, relations: ['players', 'master'] });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found.`);
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    if (user.role !== UserRole.PLAYER) {
      throw new ForbiddenException('Only players can join campaigns.');
    }

    if (campaign.players.some(player => player.id === userId)) {
      // User is already in the campaign, return campaign as is or throw ConflictException
      return campaign;
    }

    campaign.players.push(user);
    return this.campaignsRepository.save(campaign);
  }

  async leaveCampaign(campaignId: number, userId: number): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({ where: { id: campaignId }, relations: ['players', 'master'] });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found.`);
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      // Or silently succeed if user not found / not in campaign
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    campaign.players = campaign.players.filter(player => player.id !== userId);
    return this.campaignsRepository.save(campaign);
  }

  async findCampaignsByMaster(masterId: number): Promise<Campaign[]> {
    return this.campaignsRepository.find({
      where: { master_id: masterId },
      relations: ['master', 'players'],
    });
  }

  async findCampaignsForPlayer(userId: number): Promise<Campaign[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['joined_campaigns', 'joined_campaigns.master', 'joined_campaigns.players'], // Added 'joined_campaigns.players' to ensure players are loaded
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    // Ensure joined_campaigns are populated with master and players details for each campaign
    // This might require an additional step if relations are not deeply loaded as expected
    // For instance, iterating through user.joined_campaigns and loading relations if necessary
    // However, TypeORM often handles this with the relations array.
    return user.joined_campaigns;
  }
}
