import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionService } from './session.service';
import { EventDto } from './dto/event.dto';
import { User, UserRole } from '../user/user.entity';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';

@WebSocketGateway({ namespace: '/sessions', cors: { origin: 'http://localhost:5173', credentials: true } })
export class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly sessionService: SessionService) {}

  handleConnection(client: Socket) {
    // connection established
  }

  handleDisconnect(client: Socket) {
    // connection closed
  }

  @SubscribeMessage('joinSession')
  handleJoinSession(
    @MessageBody() data: { sessionId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = String(data.sessionId);
    client.join(room);
    client.emit('joinedSession', { sessionId: data.sessionId });
  }

  async broadcastEventToSession(
    sessionId: number,
    eventDto: EventDto,
    masterUser: User,
  ): Promise<void> {
    const session = await this.sessionService.getSessionById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found.`);
    }

    if (session.master_id !== masterUser.id || masterUser.role !== UserRole.MASTER) {
      throw new UnauthorizedException('You are not authorized to send an event to this session.');
    }

    this.server.to(String(sessionId)).emit('sessionEvent', { message: eventDto.message });
  }
}
