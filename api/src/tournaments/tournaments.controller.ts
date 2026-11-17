import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthUser } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { Role } from '../users/user.schema';
import { AddTeamDto } from './dto/add-team.dto';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { ListTournamentsQueryDto } from './dto/list-tournaments-query.dto';
import { ScheduleDto } from './dto/schedule.dto';
import { TournamentsService } from './tournaments.service';

@Controller('tournaments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TournamentsController {
  constructor(private readonly service: TournamentsService) {}

  @Get()
  list(@Query() query: ListTournamentsQueryDto) {
    return this.service.list(query);
  }

  @Post()
  @Roles(Role.ORGANIZER)
  create(@Req() req: { user: AuthUser }, @Body() dto: CreateTournamentDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get(':id')
  getOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.getOne(id);
  }

  @Post(':id/teams')
  @Roles(Role.ORGANIZER)
  addTeam(
    @Req() req: { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: AddTeamDto,
  ) {
    return this.service.addTeam(id, req.user.id, dto);
  }

  @Post(':id/schedule')
  @Roles(Role.ORGANIZER)
  schedule(
    @Req() req: { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ScheduleDto,
  ) {
    return this.service.schedule(id, req.user.id, dto);
  }

  @Get(':id/matches')
  matches(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.getMatches(id);
  }

  @Get(':id/standings')
  standings(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.getStandings(id);
  }
}