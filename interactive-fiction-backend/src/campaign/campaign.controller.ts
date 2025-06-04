import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../user/user.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

// Removed @UseGuards from class level, will apply to methods individually
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MASTER)
  create(@Body() createCampaignDto: { name: string; description: string; map_details?: any }, @Request() req) {
    return this.campaignService.create(createCampaignDto.name, createCampaignDto.description, createCampaignDto.map_details, req.user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt')) // Any authenticated user can list all campaigns
  findAll() {
    return this.campaignService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt')) // Any authenticated user can view a single campaign
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.campaignService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MASTER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCampaignDto: { name: string; description: string; map_details?: any },
    @Request() req,
  ) {
    return this.campaignService.update(id, updateCampaignDto.name, updateCampaignDto.description, updateCampaignDto.map_details, req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MASTER)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.campaignService.remove(id, req.user);
  }

  @Post(':id/join')
  @UseGuards(AuthGuard('jwt')) // Any authenticated user can attempt to join
  joinCampaign(@Param('id', ParseIntPipe) campaignId: number, @Request() req) {
    // req.user will contain the authenticated user object (including id and role)
    return this.campaignService.joinCampaign(campaignId, req.user.id);
  }

  @Post(':id/leave')
  @UseGuards(AuthGuard('jwt')) // Any authenticated user can attempt to leave
  leaveCampaign(@Param('id', ParseIntPipe) campaignId: number, @Request() req) {
    return this.campaignService.leaveCampaign(campaignId, req.user.id);
  }

  @Get('master/my-campaigns')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MASTER)
  findMasterCampaigns(@Request() req) {
    return this.campaignService.findCampaignsByMaster(req.user.id);
  }

  @Get('player/my-campaigns')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLAYER)
  findPlayerCampaigns(@Request() req) {
    return this.campaignService.findCampaignsForPlayer(req.user.id);
  }
}
