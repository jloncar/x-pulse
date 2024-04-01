import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Platform } from '../platform.enum';

export type PostDocument = Document & Post;

// Using capped collection is too risky as it might result in data loss
// Using time series is to optimise for calculating of moving average rate for each hashtag
@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  timeseries: {
    timeField: 'createdAt',
    metaField: 'hashtag',
    granularity: 'seconds',
  },
})
export class Post {
  @Prop({ required: true })
  postId: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  hashtag: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: Object.values(Platform) })
  platform: Platform;

  @Prop()
  createdAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.index({ createdAt: -1 }); // create desc index on createdAt
