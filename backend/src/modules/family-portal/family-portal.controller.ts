import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FamilyPortalService } from './family-portal.service';
import { GrantPortalDto } from './dto/grant-portal.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('family-portal')
@Controller()
export class FamilyPortalController {
  constructor(private readonly familyPortalService: FamilyPortalService) {}

  @Post('cases/:caseId/family-portal/grant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Grant family portal access to a contact for a case' })
  @ApiResponse({ status: 201, description: 'Portal access token created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  grant(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: GrantPortalDto,
  ) {
    return this.familyPortalService.grant(user.tenantId, caseId, dto.contactId);
  }

  @Get('family-portal/:accessToken')
  @Public()
  @ApiOperation({ summary: 'Get case data via portal access token (public)' })
  @ApiResponse({ status: 200, description: 'Returns case, contacts, and documents' })
  @ApiResponse({ status: 403, description: 'Token expired' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  getByToken(@Param('accessToken') accessToken: string) {
    return this.familyPortalService.getByToken(accessToken);
  }

  @Patch('family-portal/:accessToken/viewed')
  @Public()
  @ApiOperation({ summary: 'Mark portal as viewed (public)' })
  @ApiResponse({ status: 200, description: 'lastViewed timestamp updated' })
  @ApiResponse({ status: 403, description: 'Token expired' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  markViewed(@Param('accessToken') accessToken: string) {
    return this.familyPortalService.markViewed(accessToken);
  }
}
