import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('cases/:caseId/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.create(user.tenantId, caseId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Param('caseId') caseId: string) {
    return this.contactsService.findByCase(user.tenantId, caseId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.contactsService.remove(user.tenantId, id);
  }
}
