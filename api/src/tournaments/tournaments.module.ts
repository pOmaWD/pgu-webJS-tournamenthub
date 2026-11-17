import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchHistory, MatchHistorySchema } from './schemas/match-history.schema';
import { Match, MatchSchema } from './schemas/match.schema';
import { Team, TeamSchema } from './schemas/team.schema';
import { Tournament, TournamentSchema } from './schemas/tournament.schema';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tournament.name, schema: TournamentSchema },
      { name: Team.name, schema: TeamSchema },
      { name: Match.name, schema: MatchSchema },
      { name: MatchHistory.name, schema: MatchHistorySchema },
    ]),
    UsersModule,
  ],
  controllers: [TournamentsController, MatchesController],
  providers: [TournamentsService, MatchesService],
})
export class TournamentsModule {}