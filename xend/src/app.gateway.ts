import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ANALYTICS, TRENDING } from './posts/posts.events';
import { Logger } from '@nestjs/common';

enum WEBSOCKET_EVENTS {
  UPDATE_TRENDING = 'updateTrending',
  UPDATE_ANALYTICS = 'updateAnalytics',
}
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway implements OnGatewayConnection {
  private readonly logger = new Logger(AppGateway.name);

  // Internal tracking of trending hashtag for when new client is connected
  private trendingHashtag = null;
  private analytics = {};

  @WebSocketServer()
  server: Server;

  @OnEvent(TRENDING)
  broadcastTrending(trendingHashtag: string) {
    this.trendingHashtag = trendingHashtag;
    this.server.emit(WEBSOCKET_EVENTS.UPDATE_TRENDING, trendingHashtag);
  }

  @OnEvent(ANALYTICS)
  broadcastAnalytics(analytics: any) {
    this.analytics = analytics;
    this.server.emit(WEBSOCKET_EVENTS.UPDATE_ANALYTICS, analytics);
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
    // Inform client about initial state
    client.emit(WEBSOCKET_EVENTS.UPDATE_TRENDING, this.trendingHashtag);
    client.emit(WEBSOCKET_EVENTS.UPDATE_ANALYTICS, this.analytics);
  }
}
