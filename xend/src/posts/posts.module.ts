import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './schemas/post.schema';
import {
  ArchivedPost,
  ArchivedPostSchema,
} from './schemas/archived-post.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: ArchivedPost.name, schema: ArchivedPostSchema },
    ]),
  ],
  controllers: [],
  providers: [PostsService],
})
export class PostsModule {}
