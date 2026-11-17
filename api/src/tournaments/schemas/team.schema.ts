import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, versionKey: 'version' })
export class Team {
  @Prop({ type: Types.ObjectId, ref: 'Tournament', required: true })
  tournamentId: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 60 })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  captainId: Types.ObjectId;
}

export type TeamDocument = HydratedDocument<Team>;
export const TeamSchema = SchemaFactory.createForClass(Team);

TeamSchema.index({ tournamentId: 1, name: 1 }, { unique: true });