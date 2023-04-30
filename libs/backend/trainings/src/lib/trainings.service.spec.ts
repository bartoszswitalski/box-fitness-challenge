import { CreateTrainingDto, Training as ActualTraining, User as ActualUser, uuid } from '@box-fc/shared/types';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Repository } from 'typeorm';
import { TrainingsService } from './trainings.service';

type TestUser = Omit<ActualUser, 'role'>;
type TestTraining = Omit<ActualTraining, 'user'>;

describe('TrainingsService', () => {
    const userIdStub = 'userId';
    const anotherUserIdStub = 'anotherUserId';
    const trainingIdStub = 'trainingId';
    const durationStub = 1;
    const trainingDtoStub: CreateTrainingDto = {
        userId: userIdStub,
        trainingDate: new Date(),
        duration: durationStub,
        registrationDate: new Date(),
        type: 'type',
    };
    const trainingStub = { ...trainingDtoStub, id: trainingIdStub };
    const teamStub1 = 'team1';
    const teamStub2 = 'team2';

    let todayStart: Date;
    let todayEnd: Date;
    let tomorrowEnd: Date;
    let trainingRepository: Repository<Training>;
    let userRepository: Repository<User>;
    let service: TrainingsService;
    let module: TestingModule;

    beforeEach(async () => {
        await initializeModule();
        setRepositories();
        setService();
        await stubUserRepository();
        stubDates();
    });

    it('should create an training', async () => {
        const createdTraining = await service.createTraining(trainingDtoStub);

        expect(createdTraining).toEqual({ ...trainingDtoStub, id: expect.any(String) });
    });

    it('should persist an training', async () => {
        await service.createTraining(trainingDtoStub);

        expect(await trainingRepository.find()).toEqual([{ ...trainingDtoStub, id: expect.any(String) }]);
    });

    it('should get an training', async () => {
        await trainingRepository.insert(trainingStub);

        const training = await service.getTrainingById(trainingIdStub);

        expect(training).toEqual(trainingStub);
    });

    it('should not get a non-existent training', async () => {
        const training = await service.getTrainingById(trainingIdStub);

        expect(training).toEqual(null);
    });

    it('should get all trainings', async () => {
        const trainingStub2 = { ...trainingDtoStub, id: 'anotherTrainingId' };
        await trainingRepository.insert(trainingStub);
        await trainingRepository.insert(trainingStub2);

        const trainings = await service.getAllTrainings();

        expect(trainings).toEqual([trainingStub, trainingStub2]);
    });

    it('should get user trainings', async () => {
        const anotherUserTrainingStub = { ...trainingDtoStub, id: 'anotherTrainingId', userId: anotherUserIdStub };
        await trainingRepository.insert(trainingStub);
        await trainingRepository.insert(anotherUserTrainingStub);

        const userTrainings = await service.getUserTrainings(userIdStub);

        expect(userTrainings).toEqual([trainingStub]);
    });

    it('should get user activity for one day', async () => {
        await stubMultipleUsersActivities();

        const userActivity = await service.getUserActivity(userIdStub, todayStart, todayEnd);

        expect(userActivity).toEqual({ userId: userIdStub, score: 6 });
    });

    it('should get user activity for multiple days', async () => {
        await stubMultipleUsersActivities();

        const userActivity = await service.getUserActivity(userIdStub, todayStart, tomorrowEnd);

        expect(userActivity).toEqual({ userId: userIdStub, score: 15 });
    });

    it('should get users activities for multiple days', async () => {
        await stubMultipleUsersActivities();

        const accumulatedActivities = await service.getAllUsersActivities(todayStart, tomorrowEnd);

        expect(accumulatedActivities).toEqual([
            { userId: userIdStub, score: 15 },
            { userId: anotherUserIdStub, score: 12 },
        ]);
    });

    it('should get teams activities for multiple days', async () => {
        await stubMultipleUsersActivities();

        const accumulatedActivities = await service.getAllTeamsActivities(todayStart, todayEnd);

        expect(accumulatedActivities).toEqual([
            { team: teamStub1, score: 6 },
            { team: teamStub2, score: 12 },
        ]);
    });

    it('should update training', async () => {
        await trainingRepository.insert(trainingStub);

        const updatedTraining = await service.updateTraining(trainingIdStub, { duration: durationStub + 1 });

        expect(updatedTraining).toEqual({ ...trainingStub, duration: durationStub + 1 });
    });

    it('should persist updated training', async () => {
        await trainingRepository.insert(trainingStub);

        await service.updateTraining(trainingIdStub, { duration: durationStub + 1 });

        expect(await trainingRepository.find()).toEqual([{ ...trainingStub, duration: durationStub + 1 }]);
    });

    it('should not update non-existent training', async () => {
        const updatedTraining = await service.updateTraining(trainingIdStub, { duration: durationStub + 1 });

        expect(updatedTraining).toEqual(null);
    });

    it('should delete training', async () => {
        await trainingRepository.insert(trainingStub);

        const deletedTraining = await service.deleteTraining(trainingIdStub);

        expect(deletedTraining).toEqual(trainingStub);
    });

    it('should persist deleted training', async () => {
        await trainingRepository.insert(trainingStub);

        await service.deleteTraining(trainingIdStub);

        expect(await trainingRepository.find()).toEqual([]);
    });

    it('should not delete non-existent training', async () => {
        const deletedTraining = await service.deleteTraining(trainingIdStub);

        expect(deletedTraining).toEqual(null);
    });

    async function initializeModule(): Promise<void> {
        module = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [User, Training],
                    dropSchema: true,
                    synchronize: true,
                    logging: false,
                }),
                TypeOrmModule.forFeature([User, Training]),
            ],
            providers: [TrainingsService],
        }).compile();
    }

    function setRepositories(): void {
        trainingRepository = module.get<Repository<Training>>(getRepositoryToken(Training));
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    }

    function setService(): void {
        service = module.get<TrainingsService>(TrainingsService);
    }

    async function stubUserRepository(): Promise<void> {
        const baseUserStub = {
            firstName: 'firstName',
            lastName: 'lastName',
            division: 'division',
            role: 'role',
        };
        await userRepository.insert({ id: userIdStub, email: 'email1', ...baseUserStub, team: teamStub1 });
        await userRepository.insert({ id: anotherUserIdStub, email: 'email2', ...baseUserStub, team: teamStub2 });
    }

    async function stubMultipleUsersActivities(): Promise<void> {
        const trainingStub1 = { ...trainingDtoStub, id: 'id1', duration: 1, trainingDate: todayStart };
        const trainingStub2 = { ...trainingDtoStub, id: 'id2', duration: 3, trainingDate: todayEnd };
        const trainingStub3 = { ...trainingDtoStub, id: 'id3', duration: 9, trainingDate: tomorrowEnd };
        const anotherUserTrainingStub = {
            ...trainingDtoStub,
            id: 'id4',
            userId: anotherUserIdStub,
            duration: 16,
            trainingDate: todayEnd,
        };
        await trainingRepository.insert([trainingStub1, trainingStub2, trainingStub3, anotherUserTrainingStub]);
    }

    function stubDates(): void {
        todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        todayEnd = new Date();
        todayEnd.setUTCHours(23, 59, 59, 999);
        tomorrowEnd = new Date(todayEnd);
        tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 1);
    }
});

@Entity()
class User implements TestUser {
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

    @Column()
    role: string;
}

@Entity()
export class Training implements TestTraining {
    @PrimaryGeneratedColumn('uuid')
    id: uuid;

    @Column()
    userId: uuid;

    @Column()
    type: string;

    @Column()
    duration: number;

    @Column({ type: 'datetime' })
    @Type(() => Date)
    trainingDate: Date;

    @Column({ type: 'datetime' })
    @Type(() => Date)
    registrationDate: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}