import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { Session, SessionStatus } from './session.entity';
import { User, UserRole } from '../user/user.entity';
import { Campaign } from '../campaign/campaign.entity';
import { CampaignService } from '../campaign/campaign.service'; // To fetch campaign details
import { UserService } from '../user/user.service'; // To fetch user details
import * as bcrypt from 'bcrypt';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
    private readonly campaignService: CampaignService,
    private readonly userService: UserService,
  ) {}

  async createSession(name: string, campaignId: number, master: User): Promise<Session> {
    if (master.role !== UserRole.MASTER) {
      throw new UnauthorizedException('Only Masters can create sessions.');
    }

    const campaign = await this.campaignService.findOne(campaignId);
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found.`);
    }
    if (campaign.master_id !== master.id) {
      throw new UnauthorizedException('You can only create sessions for your own campaigns.');
    }

    const newSession = this.sessionsRepository.create({
      name,
      campaign_id: campaignId,
      campaign,
      master_id: master.id,
      master,
      status: SessionStatus.PENDING,
      active_players: [], // Initialize with no players
    });
    return this.sessionsRepository.save(newSession);
  }

  async getSessionById(id: number): Promise<Session> {
    const session = await this.sessionsRepository.findOne({
      where: { id },
      relations: ['campaign', 'master', 'active_players'],
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found.`);
    }
    return session;
  }

  async listSessions(user: User): Promise<Session[]> {
    // Players can see Pending/Active sessions to join
    // Masters can see all their sessions
    if (user.role === UserRole.MASTER) {
      return this.sessionsRepository.find({
        where: { master_id: user.id },
        relations: ['campaign', 'master', 'active_players'],
      });
    }
    return this.sessionsRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.campaign', 'campaign')
      .leftJoinAndSelect('session.master', 'master')
      .leftJoinAndSelect('session.active_players', 'active_players')
      .where('session.status IN (:...statuses)', {
        statuses: [SessionStatus.PENDING, SessionStatus.ACTIVE],
      })
      .andWhere(
        new Brackets(qb => {
          qb.where('campaign.is_public = true').orWhere('active_players.id = :userId', {
            userId: user.id,
          });
        }),
      )
      .getMany();
  }

  async joinSession(
    sessionId: number,
    player: User,
    joinToken?: string,
    password?: string,
  ): Promise<Session> {
    if (player.role !== UserRole.PLAYER) {
      throw new UnauthorizedException('Only Players can join sessions.');
    }
    const session = await this.getSessionById(sessionId);
    if (session.status !== SessionStatus.PENDING && session.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException('Session is not active or pending.');
    }

    if (!session.campaign.is_public) {
      if (!joinToken || joinToken !== session.campaign.join_token) {
        throw new UnauthorizedException('Invalid join token.');
      }
      if (session.campaign.password_hash) {
        const match = await bcrypt.compare(
          password || '',
          session.campaign.password_hash,
        );
        if (!match) {
          throw new UnauthorizedException('Invalid password.');
        }
      }
    }

    const playerAlreadyJoined = session.active_players.some(p => p.id === player.id);
    if (playerAlreadyJoined) {
      throw new BadRequestException('Player already in this session.');
    }
    
    // Prevent Master from joining their own session as a player
    if (session.master_id === player.id) {
        throw new BadRequestException('Master cannot join their own session as a player.');
    }

    session.active_players.push(player);
    return this.sessionsRepository.save(session);
  }

  async leaveSession(sessionId: number, player: User): Promise<Session> {
    const session = await this.getSessionById(sessionId);
    
    const playerIndex = session.active_players.findIndex(p => p.id === player.id);
    if (playerIndex === -1) {
      throw new BadRequestException('Player is not in this session.');
    }

    session.active_players.splice(playerIndex, 1);
    return this.sessionsRepository.save(session);
  }

  async endSession(sessionId: number, master: User): Promise<Session> {
    const session = await this.getSessionById(sessionId);
    if (session.master_id !== master.id || master.role !== UserRole.MASTER) {
      throw new UnauthorizedException('You are not authorized to end this session.');
    }
    if (session.status === SessionStatus.ENDED) {
        throw new BadRequestException('Session has already ended.');
    }
    session.status = SessionStatus.ENDED;
    return this.sessionsRepository.save(session);
  }

  // Helper to find a session by ID, potentially useful for other modules too
  async findOne(id: number): Promise<Session | null> {
    return this.sessionsRepository.findOne({ where: { id }, relations: ['campaign', 'master', 'active_players'] });
  }

  private readonly logger = new Logger(SessionService.name);
}
