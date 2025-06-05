import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../user/user.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileStorageService } from './file-storage.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  @Post()
  @Roles(UserRole.MASTER)
  @UseInterceptors(FileInterceptor('model'))
  async create(
    @UploadedFile() model: Express.Multer.File,
    @Body() createCampaignDto: { name: string; description: string; map_details?: any },
    @Request() req,
  ) {
    const modelPath = model ? await this.fileStorageService.saveModelFile(model) : undefined;
    return this.campaignService.create(
      createCampaignDto.name,
      createCampaignDto.description,
      createCampaignDto.map_details,
      req.user,
      modelPath,
    );
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
  @UseInterceptors(FileInterceptor('model'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() model: Express.Multer.File,
    @Body() updateCampaignDto: { name: string; description: string; map_details?: any },
    @Request() req,
  ) {
    const modelPath = model ? await this.fileStorageService.saveModelFile(model) : undefined;
    return this.campaignService.update(
      id,
      updateCampaignDto.name,
      updateCampaignDto.description,
      updateCampaignDto.map_details,
      req.user,
      modelPath,
    );
  }

  @Delete(':id')
  @Roles(UserRole.MASTER)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.campaignService.remove(id, req.user);
  }
}
