import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import got from 'got';
import { NewPostDto } from 'src/posts/dto/new-post.dto';
import { Platform } from 'src/posts/platform.enum';
import { EVENT_POST_NEW } from 'src/posts/posts.events';

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  hashtag: string;
  user: {
    id: string;
    name: string;
    screen_name: string;
  };
}

@Injectable()
export class TweetsService {
  private streamUrl;
  private readonly logger = new Logger(TweetsService.name);

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.streamUrl = this.configService.get<string>('XMOCK_URL') + '/stream';
    this.streamConnect();
  }

  private streamConnect() {
    this.logger.debug('Connecting to stream: ' + this.streamUrl);
    const stream = got.stream(this.streamUrl, {
      // timeout: { request: 20000 }, // Setting request timeout
      retry: {
        limit: 5, // Maximum number of retries
        methods: ['GET'], // Retry only for GET requests
        statusCodes: [403, 404, 500, 502, 503, 504], // Retry on these status codes
        errorCodes: [
          // 'ETIMEDOUT',
          'ECONNRESET',
          'EADDRINUSE',
          'ECONNREFUSED',
          'EPIPE',
          'ENOTFOUND',
          'ENETUNREACH',
          'EAI_AGAIN',
        ],
        calculateDelay: ({ attemptCount, error, computedValue }) => {
          // Use whatever logic you want to determine the delay between retries
          // For example, increasing the delay with each attempt:
          if (error.response && error.response.statusCode === 429) {
            // Too many requests
            // Respect Retry-After header if present
            return error.response.headers['retry-after']
              ? Number(error.response.headers['retry-after']) * 1000
              : 60000;
          }
          // Increase delay with each retry attempt
          return Math.min(computedValue * attemptCount, 60000); // cap at 60 seconds
        },
      },
    });

    stream
      .on('data', (chunk) => this.processStreamData(chunk))
      .on('error', (error) => this.processStreamError(error));
  }

  private processStreamData(data: any) {
    String(data)
      .split('\n\n')
      .forEach((dataChunk: string) => {
        if (dataChunk !== '') {
          try {
            const object: Tweet = JSON.parse(dataChunk.replace(/^data: /, ''));
            this.eventEmitter.emit(EVENT_POST_NEW, this.tweetToNewPost(object));
          } catch (error) {
            this.logger.warn(`Error parsing tweet data: "${data}"`);
          }
        }
      });
  }

  private processStreamError(error: any) {
    this.logger.error(`STREAM ERROR "${error.code}": ${error}`);
    return;
  }

  private tweetToNewPost(object: Tweet): NewPostDto {
    return {
      postId: object.id,
      text: object.text,
      hashtag: object.hashtag,
      userId: object.user.id,
      platform: Platform.TWITTER,
    };
  }
}
