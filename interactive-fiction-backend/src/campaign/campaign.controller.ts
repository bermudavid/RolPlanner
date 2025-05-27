import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../user/user.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @Roles(UserRole.MASTER)
  create(@Body() createCampaignDto: { name: string; description: string; map_details?: any }, @Request() req) {
    return this.campaignService.create(createCampaignDto.name, createCampaignDto.description, createCampaignDto.map_details, req.user);
  }

  @Get()
  findAll() {
    return this.campaignService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.campaignService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.MASTER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCampaignDto: { name: string; description: string; map_details?: any },
    @Request() req,
  ) {
    return this.campaignService.update(id, updateCampaignDto.name, updateCampaignDto.description, updateCampaignDto.map_details, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.MASTER)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.campaignService.remove(id, req.user);
  }
}
