import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly cognito: CognitoIdentityProviderClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.cognito = new CognitoIdentityProviderClient({
      region: this.configService.get<string>('AWS_REGION') ?? 'us-east-2',
    });
  }

  async create(tenantId: string, dto: CreateUserDto) {
    const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID');

    // 1. Create Cognito user with custom attributes
    const cognitoResult = await this.cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: dto.email,
        UserAttributes: [
          { Name: 'email', Value: dto.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:tenantId', Value: tenantId },
          { Name: 'custom:role', Value: dto.role },
        ],
        MessageAction: 'SUPPRESS',
      }),
    );

    // 2. Set permanent password
    await this.cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: dto.email,
        Password: dto.temporaryPassword,
        Permanent: true,
      }),
    );

    // 3. Mirror to Prisma User — use forTenant() so tenantId auto-injects
    const cognitoSub =
      cognitoResult.User?.Attributes?.find((a) => a.Name === 'sub')?.Value ?? '';

    return this.prisma.forTenant(tenantId).user.create({
      data: {
        tenantId,
        email: dto.email,
        name: dto.name,
        role: dto.role,
        cognitoSub,
      },
    });
  }

  findAll(tenantId: string) {
    return this.prisma.forTenant(tenantId).user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }
}
