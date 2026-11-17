import { Body, Controller, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthUser } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { Role } from '../users/user.schema';
import { CorrectResultDto } from './dto/correct-result.dto';
import { EnterResultDto } from './dto/enter-result.dto';
import { MatchesService } from './matches.service';

@Controller('matches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchesController {
  constructor(private readonly service: MatchesService) {}

  @Post(':id/result')
  @Roles(Role.REFEREE)
  enter(
    @Req() req: { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: EnterResultDto,
  ) {
    return this.service.enterResult(id, req.user.id, dto);
  }

  @Patch(':id/result')
  @Roles(Role.REFEREE)
  correct(
    @Req() req: { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: CorrectResultDto,
  ) {
    return this.service.correctResult(id, req.user.id, dto);
  }
}