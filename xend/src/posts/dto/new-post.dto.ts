import { IsEnum, IsString, Matches } from 'class-validator';
import { Platform } from '../platform.enum';

export class NewPostDto {
  @IsString()
  postId: string;

  @IsString()
  text: string;

  @IsString()
  @Matches(/^[^#][A-Za-z0-9_-]*$/, {
    message:
      'Hashtag should not start with # and must be alphanumeric with underscores or minus signs only',
  })
  hashtag: string;

  @IsString()
  userId: string;

  @IsEnum(Platform)
  platform: Platform;
}
