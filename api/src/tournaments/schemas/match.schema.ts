import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  FINISHED = 'finished',
}

@Schema({ timestamps: true, versionKey: 'version' })
export class Match {
  @Prop({ type: Types.ObjectId, ref: 'Tournament', required: true })
  tournamentId: Types.ObjectId;

  @Prop({ required: true, min: 1, validate: Number.isInteger })
  round: number;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  homeTeamId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  awayTeamId: Types.ObjectId;

  @Prop({ required: true })
  pairKey: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  refereeId: Types.ObjectId | null;

  @Prop({ required: true, enum: MatchStatus, default: MatchStatus.SCHEDULED })
  status: MatchStatus;

  @Prop({
    type: Number,
    min: 0,
    default: null,
    validate: (v: number | null) => v === null || Number.isInteger(v),
  })
  homeScore: number | null;

  @Prop({
    type: Number,
    min: 0,
    default: null,
    validate: (v: number | null) => v === null || Number.isInteger(v),
  })
  awayScore: number | null;
}

export type MatchDocument = HydratedDocument<Match>;
export const MatchSchema = SchemaFactory.createForClass(Match);

MatchSchema.index({ tournamentId: 1, pairKey: 1 }, { unique: true });
MatchSchema.index({ tournamentId: 1, round: 1 });