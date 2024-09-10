import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany } from 'typeorm';
import { UserDataHash } from './UserDataHash';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    username!: string;

    @Column()
    passwordHash!: string;

    @Column({ default: true })
    isActive!: boolean;

    // One user can have many associated data hashes
    @OneToMany(() => UserDataHash, (dataHash) => dataHash.user)
    dataHashes!: UserDataHash[];
}
