import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { JwtService } from '@nestjs/jwt';
import { Injectable, UseGuards } from '@nestjs/common';

@WebSocketGateway({
  path: '/ws',
  cors: { origin: '*' },
})
@Injectable()
export class WhatsAppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track connected sockets mapped by organization
  private orgRooms = new Map<string, Set<WebSocket>>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: WebSocket, ...args: any[]) {
    try {
      // In a raw WebSocket connection, query string is parsed from client URL
      const url = (client as any).upgradeReq?.url || '';
      const token = new URL('http://localhost' + url).searchParams.get('token');

      if (!token) {
        client.close(4001, 'Unauthorized - Missing Token');
        return;
      }

      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'whatsaas_super_secret_jwt_signkey_1029384756',
      });

      const orgId = decoded.orgId;
      (client as any).orgId = orgId;
      (client as any).userId = decoded.sub;

      if (!this.orgRooms.has(orgId)) {
        this.orgRooms.set(orgId, new Set());
      }
      this.orgRooms.get(orgId).add(client);
      
      console.log(`WebSocket client connected: user ${decoded.sub} in organization ${orgId}`);
      client.send(JSON.stringify({ event: 'connected', data: { status: 'ok' } }));
    } catch (err) {
      console.error('WebSocket connection authentication error:', err.message);
      client.close(4002, 'Unauthorized - Invalid Token');
    }
  }

  handleDisconnect(client: WebSocket) {
    const orgId = (client as any).orgId;
    if (orgId && this.orgRooms.has(orgId)) {
      this.orgRooms.get(orgId).delete(client);
      if (this.orgRooms.get(orgId).size === 0) {
        this.orgRooms.delete(orgId);
      }
    }
    console.log(`WebSocket client disconnected: user ${(client as any).userId}`);
  }

  // Broadcast real-time event to all clients in an organization
  broadcastToOrg(organizationId: string, event: string, data: any) {
    const clients = this.orgRooms.get(organizationId);
    if (clients) {
      const payload = JSON.stringify({ event, data });
      clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN state
          client.send(payload);
        }
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: WebSocket) {
    client.send(JSON.stringify({ event: 'pong', data: 'pong' }));
  }
}
