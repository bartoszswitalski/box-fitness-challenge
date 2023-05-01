import {
    CreateTrainingDto,
    Optional,
    TeamActivity,
    Training,
    UpdateTrainingDto,
    User,
    UserActivity,
} from '@box-fc/shared/types';
import { roundFloat } from '@box-fc/shared/util';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CreatesTraining, DeletesTraining, GetsTrainings, UpdatesTraining } from './interfaces';

type UserId = Training['userId'];
type Team = User['team'];

@Injectable()
export class TrainingsService implements CreatesTraining, GetsTrainings, UpdatesTraining, DeletesTraining {
    private static readonly SCORE_FACTOR = 3;

    constructor(
        @InjectRepository(Training) private trainingsRepository: Repository<Training>,
        @InjectRepository(User) private usersRepository: Repository<User>,
    ) {}

    createTraining(createTrainingDto: CreateTrainingDto): Promise<Training> {
        const training = this.trainingsRepository.create(createTrainingDto);

        return this.trainingsRepository.save(training);
    }

    getAllTrainings(): Promise<Training[]> {
        return this.trainingsRepository.find();
    }

    getTrainingById(trainingId: Training['id']): Promise<Optional<Training>> {
        return this.trainingsRepository.findOne({ where: { id: trainingId } });
    }

    getUserTrainings(userId: UserId): Promise<Training[]> {
        return this.trainingsRepository.find({ where: { userId: userId } });
    }

    async getUserActivity(userId: UserId, startDate: Date, endDate: Date): Promise<UserActivity> {
        const trainings = await this.trainingsRepository.find({
            where: { userId: userId, trainingDate: Between(startDate, endDate) },
        });
        const userScore = this._getTrainingsScore(trainings);

        return { userId, score: userScore };
    }

    async getAllUsersActivities(startDate: Date, endDate: Date): Promise<UserActivity[]> {
        const trainings = await this._getTrainingsInRange(startDate, endDate);
        const usersTrainings = trainings.reduce((acc, training) => {
            acc.set(training.userId, [...(acc.get(training.userId) ?? []), training]);

            return acc;
        }, new Map<UserId, Training[]>());

        return Array.from(usersTrainings.entries()).map(([userId, trainings]) => ({
            userId,
            score: this._getTrainingsScore(trainings),
        }));
    }

    async getAllTeamsActivities(startDate: Date, endDate: Date): Promise<TeamActivity[]> {
        const trainings = await this._getTrainingsInRange(startDate, endDate);
        const users = await this.usersRepository.find();
        const usersTeams = new Map(users.map(({ id, team }) => [id, team]));

        const teamsTrainings = trainings.reduce((acc, training) => {
            const team = usersTeams.get(training.userId) as string;
            acc.set(team, [...(acc.get(team) ?? []), training]);

            return acc;
        }, new Map<Team, Training[]>());

        return Array.from(teamsTrainings.entries()).map(([team, trainings]) => ({
            team,
            score: this._getTrainingsScore(trainings),
        }));
    }

    async updateTraining(
        trainingId: Training['id'],
        updateTrainingDto: UpdateTrainingDto,
    ): Promise<Optional<Training>> {
        await this.trainingsRepository.update(trainingId, updateTrainingDto);

        return await this.getTrainingById(trainingId);
    }

    async deleteTraining(trainingId: Training['id']): Promise<Optional<Training>> {
        const training = await this.getTrainingById(trainingId);

        await this.trainingsRepository.delete(trainingId);

        return training;
    }

    private _getTrainingsScore(trainings: Training[]): number {
        const dailyActiveTimes = trainings.reduce((acc, { trainingDate, duration }) => {
            const date = trainingDate.toISOString().split('T')[0];

            acc.set(date, (acc.get(date) ?? 0) + duration);

            return acc;
        }, new Map<string, number>());
        const dailyActiveTimesArray = Array.from(dailyActiveTimes.values());
        const overallScore = dailyActiveTimesArray.reduce(
            (acc, activeTime) => acc + Math.sqrt(activeTime) * TrainingsService.SCORE_FACTOR,
            0,
        );

        return roundFloat(overallScore);
    }

    private _getTrainingsInRange(startDate: Date, endDate: Date): Promise<Training[]> {
        return this.trainingsRepository.find({ where: { trainingDate: Between(startDate, endDate) } });
    }
}
