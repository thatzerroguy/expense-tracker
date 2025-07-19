import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createUserSchema = z.object({
  name: z.string().nonoptional('Name is required'),
  email: z.email({ pattern: z.regexes.email }).nonoptional('Email is required'),
  password: z.string().nonoptional('Password is required'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export class CreateUserResponseDto {
  @ApiProperty({
    description: 'Indicates whether the user was created successfully',
  })
  success: boolean;

  @ApiProperty({
    description: 'The unique identifier of the created user',
  })
  uuid: string;

  @ApiProperty({
    description: 'The JWT token for the created user',
  })
  token: string;

  @ApiProperty({
    description: 'HTTP status code of the response',
    example: 201,
  })
  status: number;

  constructor(
    success: boolean,
    uuid: string,
    token: string,
    status: number = 201,
  ) {
    this.success = success;
    this.uuid = uuid;
    this.token = token;
    this.status = status;
  }
}
