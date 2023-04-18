import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../role.type';
import { uuid } from '../uuid.type';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: uuid;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ unique: true })
    email: string;

    @Column()
    team: string;

    @Column()
    division: string;

    @Column({ type: 'enum', enum: Role })
    role: Role;
}
