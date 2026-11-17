import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CorrectResultDto } from './dto/correct-result.dto';
import { EnterResultDto } from './dto/enter-result.dto';
import { Match, MatchDocument, MatchStatus } from './schemas/match.schema';
import {
  HistoryType,
  MatchHistory,
  MatchHistoryDocument,
} from './schemas/match-history.schema';

@Injectable()
export class MatchesService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel(MatchHistory.name) private historyModel: Model<MatchHistoryDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  private async getAssignedMatch(matchId: string, refereeId: string) {
    const match = await this.matchModel.findById(matchId);
    if (!match || match.refereeId?.toString() !== refereeId) {
      throw new NotFoundException('Матч не найден');
    }
    return match;
  }

  async enterResult(matchId: string, refereeId: string, dto: EnterResultDto) {
    const match = await this.getAssignedMatch(matchId, refereeId);
    if (match.status !== MatchStatus.SCHEDULED) {
      throw new ConflictException('Результат уже внесён');
    }

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const updated = await this.matchModel.findOneAndUpdate(
          { _id: match._id, status: MatchStatus.SCHEDULED },
          {
            $set: {
              homeScore: dto.homeScore,
              awayScore: dto.awayScore,
              status: MatchStatus.FINISHED,
            },
            $inc: { version: 1 },
          },
          { session },
        );
        if (!updated) throw new ConflictException('Результат уже внесён');
        await this.historyModel.create(
          [
            {
              matchId: match._id,
              tournamentId: match.tournamentId,
              type: HistoryType.ENTERED,
              newHomeScore: dto.homeScore,
              newAwayScore: dto.awayScore,
              changedBy: refereeId,
            },
          ],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return this.matchModel.findById(match._id).lean();
  }

  async correctResult(matchId: string, refereeId: string, dto: CorrectResultDto) {
    const match = await this.getAssignedMatch(matchId, refereeId);
    if (match.status !== MatchStatus.FINISHED) {
      throw new ConflictException('Результат ещё не внесён');
    }

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const previous = await this.matchModel.findOneAndUpdate(
          { _id: match._id, status: MatchStatus.FINISHED, version: dto.version },
          {
            $set: { homeScore: dto.homeScore, awayScore: dto.awayScore },
            $inc: { version: 1 },
          },
          { session },
        );
        if (!previous) {
          throw new ConflictException('Данные устарели, обновите страницу');
        }
        await this.historyModel.create(
          [
            {
              matchId: match._id,
              tournamentId: match.tournamentId,
              type: HistoryType.CORRECTED,
              oldHomeScore: previous.homeScore,
              oldAwayScore: previous.awayScore,
              newHomeScore: dto.homeScore,
              newAwayScore: dto.awayScore,
              reason: dto.reason,
              changedBy: refereeId,
            },
          ],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return this.matchModel.findById(match._id).lean();
  }
}