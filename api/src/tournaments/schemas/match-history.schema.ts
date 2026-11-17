import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum HistoryType {
  ENTERED = 'entered',
  CORRECTED = 'corrected',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class MatchHistory {
  @Prop({ type: Types.ObjectId, ref: 'Match', required: true })
  matchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tournament', required: true })
  tournamentId: Types.ObjectId;

  @Prop({ required: true, enum: HistoryType })
  type: HistoryType;

  @Prop({ type: Number, default: null })
  oldHomeScore: number | null;

  @Prop({ type: Number, default: null })
  oldAwayScore: number | null;

  @Prop({ required: true, min: 0 })
  newHomeScore: number;

  @Prop({ required: true, min: 0 })
  newAwayScore: number;

  @Prop({ trim: true, maxlength: 500, default: '' })
  reason: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  changedBy: Types.ObjectId;
}

export type MatchHistoryDocument = HydratedDocument<MatchHistory>;
export const MatchHistorySchema = SchemaFactory.createForClass(MatchHistory);

MatchHistorySchema.index({ matchId: 1, createdAt: 1 });