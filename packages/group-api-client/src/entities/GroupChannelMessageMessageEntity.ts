import { ChildEntity } from 'typeorm';
import { GroupChannelMessageEntity } from './GroupChannelMessageEntity';

@ChildEntity('message')
export class GroupChannelMessageMessageEntity extends GroupChannelMessageEntity {}
