import { Controller, Get, Post, Body, Param, UseGuards, Request, ParseIntPipe, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { SessionService } from './session.service';
import { AuthGuard } from '@nestjs/passport';
import { EventDto } from './dto/event.dto';
import { UserRole } from '../user/user.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @Roles(UserRole.MASTER)
  createSession(@Body() createSessionDto: { name: string; campaign_id: number }, @Request() req) {
    return this.sessionService.createSession(createSessionDto.name, createSessionDto.campaign_id, req.user);
  }

  @Get()
  listSessions(@Request() req) {
    // Service will differentiate based on user role
    return this.sessionService.listSessions(req.user);
  }

  @Get(':id')
  getSessionById(@Param('id', ParseIntPipe) id: number) {
    return this.sessionService.getSessionById(id);
  }

  @Post(':id/join')
  @Roles(UserRole.PLAYER)
  joinSession(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.sessionService.joinSession(id, req.user);
  }

  @Post(':id/leave')
  @Roles(UserRole.PLAYER)
  leaveSession(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.sessionService.leaveSession(id, req.user);
  }

  @Patch(':id/end') // Using PATCH as it's a partial update (status change)
  @Roles(UserRole.MASTER)
  endSession(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.sessionService.endSession(id, req.user);
  }

  @Post(':id/event')
  @Roles(UserRole.MASTER)
  @HttpCode(HttpStatus.OK) // Or 202 Accepted if processing is async
  async broadcastEvent(
    @Param('id', ParseIntPipe) sessionId: number,
    @Body() eventDto: EventDto,
    @Request() req,
  ) {
    // req.user is the authenticated User object from JwtStrategy
    await this.sessionService.broadcastEventToSession(sessionId, eventDto, req.user);
    return { message: 'Event broadcast initiated.' }; // Or simply return nothing for 204 No Content
  }
}
