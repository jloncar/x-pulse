import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post, PostDocument } from './post.schema';

export type ArchivedPostDocument = PostDocument;

@Schema({ collection: 'archivedPosts' })
export class ArchivedPost extends Post {
  @Prop({ default: Date.now })
  archivedAt: Date;
}

export const ArchivedPostSchema = SchemaFactory.createForClass(ArchivedPost);
