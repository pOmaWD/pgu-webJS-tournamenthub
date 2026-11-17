import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Role } from '../users/user.schema';
import { UsersService } from '../users/users.service';
import { AddTeamDto } from './dto/add-team.dto';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { ListTournamentsQueryDto } from './dto/list-tournaments-query.dto';
import { ScheduleDto } from './dto/schedule.dto';
import { Match, MatchDocument, MatchStatus } from './schemas/match.schema';
import { Team, TeamDocument } from './schemas/team.schema';
import {
  Tournament,
  TournamentDocument,
  TournamentStatus,
} from './schemas/tournament.schema';
import { calculateStandings } from './standings';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectModel(Tournament.name) private tournamentModel: Model<TournamentDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectConnection() private connection: Connection,
    private users: UsersService,
  ) {}

  create(organizerId: string, dto: CreateTournamentDto) {
    return this.tournamentModel.create({
      name: dto.name,
      description: dto.description ?? '',
      settings: { maxTeams: dto.maxTeams, location: dto.location ?? '' },
      organizerId,
    });
  }

  async list(query: ListTournamentsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.q) {
      const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escaped, $options: 'i' };
    }
    const [items, total] = await Promise.all([
      this.tournamentModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.tournamentModel.countDocuments(filter),
    ]);
    return { items, page, limit, total };
  }

  async getOne(id: string) {
    const tournament = await this.tournamentModel.findById(id);
    if (!tournament) throw new NotFoundException('Турнир не найден');
    return tournament;
  }

  private async getOwned(id: string, organizerId: string) {
    const tournament = await this.getOne(id);
    if (tournament.organizerId.toString() !== organizerId) {
      throw new NotFoundException('Турнир не найден');
    }
    return tournament;
  }

  async addTeam(id: string, organizerId: string, dto: AddTeamDto) {
    const tournament = await this.getOwned(id, organizerId);
    if (tournament.status !== TournamentStatus.DRAFT) {
      throw new ConflictException('Состав турнира уже закрыт');
    }
    const count = await this.teamModel.countDocuments({
      tournamentId: tournament._id,
    });
    if (count >= tournament.settings.maxTeams) {
      throw new ConflictException('Достигнут лимит команд турнира');
    }
    const captain = await this.users.findByEmail(dto.captainEmail);
    if (!captain || !captain.active || captain.role !== Role.CAPTAIN) {
      throw new BadRequestException('Капитан с таким email не найден');
    }
    try {
      return await this.teamModel.create({
        tournamentId: tournament._id,
        name: dto.name,
        captainId: captain._id,
      });
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new ConflictException('Команда с таким названием уже есть в турнире');
      }
      throw e;
    }
  }

  async schedule(id: string, organizerId: string, dto: ScheduleDto) {
    const tournament = await this.getOwned(id, organizerId);
    if (tournament.status !== TournamentStatus.DRAFT) {
      throw new ConflictException('Расписание уже создано');
    }
    const teams = await this.teamModel
      .find({ tournamentId: tournament._id })
      .sort({ _id: 1 });
    if (teams.length < 4) {
      throw new ConflictException('Для расписания нужно минимум 4 команды');
    }
    const uniqueRefereeIds = [...new Set(dto.refereeIds)];
    const referees = await this.users.findActiveByIdsAndRole(
      uniqueRefereeIds,
      Role.REFEREE,
    );
    if (referees.length !== uniqueRefereeIds.length) {
      throw new BadRequestException('Некоторые судьи не найдены');
    }

    const pairs = this.buildRoundRobin(teams.map((t) => t._id));
    const matches = pairs.map((p, index) => ({
      tournamentId: tournament._id,
      round: p.round,
      homeTeamId: p.home,
      awayTeamId: p.away,
      pairKey: [p.home.toString(), p.away.toString()].sort().join('-'),
      refereeId: referees[index % referees.length]._id,
    }));

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const updated = await this.tournamentModel.findOneAndUpdate(
          { _id: tournament._id, status: TournamentStatus.DRAFT },
          { $set: { status: TournamentStatus.SCHEDULED }, $inc: { version: 1 } },
          { session },
        );
        if (!updated) throw new ConflictException('Расписание уже создано');
        await this.matchModel.insertMany(matches, { session });
      });
    } finally {
      await session.endSession();
    }
    return this.getMatches(id);
  }

  async getMatches(id: string) {
    await this.getOne(id);
    return this.matchModel
      .find({ tournamentId: new Types.ObjectId(id) })
      .sort({ round: 1, _id: 1 })
      .populate('homeTeamId', 'name')
      .populate('awayTeamId', 'name')
      .lean();
  }

  async getStandings(id: string) {
    const tournament = await this.getOne(id);
    const [teams, matches] = await Promise.all([
      this.teamModel.find({ tournamentId: tournament._id }).lean(),
      this.matchModel
        .find({ tournamentId: tournament._id, status: MatchStatus.FINISHED })
        .lean(),
    ]);
    return calculateStandings(
      teams.map((t) => ({ id: t._id.toString(), name: t.name })),
      matches.map((m) => ({
        homeTeamId: m.homeTeamId.toString(),
        awayTeamId: m.awayTeamId.toString(),
        homeScore: m.homeScore as number,
        awayScore: m.awayScore as number,
      })),
    );
  }

  private buildRoundRobin(teamIds: Types.ObjectId[]) {
    const list: (Types.ObjectId | null)[] = [...teamIds];
    if (list.length % 2 === 1) list.push(null);
    const n = list.length;
    const result: { round: number; home: Types.ObjectId; away: Types.ObjectId }[] = [];
    for (let round = 1; round < n; round++) {
      for (let i = 0; i < n / 2; i++) {
        const home = list[i];
        const away = list[n - 1 - i];
        if (home && away) result.push({ round, home, away });
      }
      list.splice(1, 0, list.pop() as Types.ObjectId | null);
    }
    return result;
  }
}