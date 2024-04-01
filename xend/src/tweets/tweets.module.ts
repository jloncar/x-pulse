import { Module } from '@nestjs/common';
import { TweetsService } from './tweets.service';

@Module({
  imports: [],
  controllers: [],
  providers: [TweetsService],
})
export class TweetsModule {}
