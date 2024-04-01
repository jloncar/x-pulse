import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Post } from './schemas/post.schema';
import { ArchivedPost } from './schemas/archived-post.schema';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NewPostDto } from './dto/new-post.dto';
import { Interval } from '@nestjs/schedule';
import { EVENT_POST_NEW, TRENDING } from './posts.events';

// Maximum number of records in posts collection
export const POSTS_CAP = 100000;

// Archive old posts cooldown (so we don't run it after every post)
const ARCHIVE_COOLDOWN_MS = 5000;

@Injectable()
export class PostsService {
  private lastArchiveTime: number = 0;
  private readonly logger = new Logger(PostsService.name);

  private currentTrending = null;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    @InjectConnection() private connection: Connection,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(ArchivedPost.name)
    private archivedPostModel: Model<ArchivedPost>,
  ) {}

  @OnEvent(EVENT_POST_NEW)
  async createPost(newPostDto: NewPostDto) {
    const postCount = await this.postModel.estimatedDocumentCount();
    const newPost = await new this.postModel(newPostDto).save();

    if (postCount >= POSTS_CAP) {
      const now = Date.now();
      if (now - this.lastArchiveTime > ARCHIVE_COOLDOWN_MS) {
        this.logger.log(
          `Post count ${postCount} exceeding ${POSTS_CAP}, archiving...`,
        );
        await this.archiveOldPosts();
        this.lastArchiveTime = now;
      } else {
        this.logger.log(
          `Post count ${postCount} exceeding ${POSTS_CAP}, but archive still on cooldown.`,
        );
      }
    }

    return newPost;
  }

  private async archiveOldPosts() {
    try {
      const thresholdPost = await this.postModel
        .find()
        .sort({ createdAt: -1 })
        .skip(POSTS_CAP)
        .limit(1);
      if (thresholdPost.length > 0) {
        const archiveCondition = {
          createdAt: { $lt: thresholdPost[0].createdAt },
        };
        const postsToArchive = await this.postModel.find(archiveCondition);

        this.logger.log(`Archiving ${postsToArchive.length} posts...`);

        // Directly archive and delete without using a session or transaction (to be fixed for prod).
        await this.archivedPostModel.insertMany(
          postsToArchive.map((post) => post.toObject()),
        );
        await this.postModel.deleteMany(archiveCondition);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Fixes timezone issues when querying mongo
   * @param seconds
   * @returns
   */
  private reduceSecondsUtc(seconds: number) {
    return new Date(
      Date.now() +
        1000 * 60 * 60 * (new Date().getTimezoneOffset() / 60) -
        seconds * 1000,
    );
  }

  @Interval(3000)
  async detectTrending() {
    const longWindowSeconds = 30;
    const shortWindowSeconds = 15;

    const anomalies = await this.postModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: this.reduceSecondsUtc(longWindowSeconds),
          },
        },
      },
      {
        $setWindowFields: {
          partitionBy: '$hashtag',
          sortBy: { createdAt: 1 },
          output: {
            postsInLongWindow: {
              $count: {},
              window: {
                range: [-longWindowSeconds, 'current'],
                unit: 'second',
              },
            },
            postsInShortWindow: {
              $count: {},
              window: {
                range: [-shortWindowSeconds, 'current'],
                unit: 'second',
              },
            },
          },
        },
      },
      {
        $project: {
          hashtag: '$hashtag',
          rateLongWindow: {
            $divide: ['$postsInLongWindow', longWindowSeconds],
          },
          rateShortWindow: {
            $divide: ['$postsInShortWindow', shortWindowSeconds],
          },
        },
      },
      {
        $project: {
          hashtag: 1,
          rateIncrease: {
            $subtract: ['$rateShortWindow', '$rateLongWindow'],
          },
        },
      },
      {
        $group: {
          _id: '$hashtag',
          avgRateIncrease: { $avg: '$rateIncrease' },
        },
      },
      {
        $sort: { avgRateIncrease: -1 },
      },
    ]);

    console.log('Rate increases: ', anomalies);
    const trendingCandidate = anomalies[0] ? anomalies[0]['_id'] : null;
    if (this.currentTrending !== trendingCandidate) {
      this.logger.debug(
        `New trending! ${trendingCandidate} replaces ${this.currentTrending}`,
      );
      this.currentTrending = trendingCandidate;
      this.eventEmitter.emit(TRENDING, this.currentTrending);
    }
  }
}
