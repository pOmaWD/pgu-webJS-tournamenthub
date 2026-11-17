import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum TournamentStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  FINISHED = 'finished',
}

@Schema({ _id: false })
export class TournamentSettings {
  @Prop({ required: true, min: 4, max: 8, validate: Number.isInteger })
  maxTeams: number;

  @Prop({ trim: true, maxlength: 120, default: '' })
  location: string;
}
export const TournamentSettingsSchema =
  SchemaFactory.createForClass(TournamentSettings);

@Schema({ timestamps: true, versionKey: 'version' })
export class Tournament {
  @Prop({ required: true, trim: true, minlength: 3, maxlength: 120 })
  name: string;

  @Prop({ trim: true, maxlength: 4000, default: '' })
  description: string;

  @Prop({ type: TournamentSettingsSchema, required: true })
  settings: TournamentSettings;

  @Prop({ required: true, enum: TournamentStatus, default: TournamentStatus.DRAFT })
  status: TournamentStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  organizerId: Types.ObjectId;
}

export type TournamentDocument = HydratedDocument<Tournament>;
export const TournamentSchema = SchemaFactory.createForClass(Tournament);

TournamentSchema.index({ status: 1, createdAt: -1 });