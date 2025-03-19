import { Request, Response } from 'express';
import { UserEntity, GetUserParams } from 'user-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const getUser = async (req: Request<GetUserParams>, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            res.status(400).send('User ID parameter is missing');
            return;
        }

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const user = await dataSource.manager.findOne(UserEntity, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            where: { id: userId },
        });

        if (!user) {
            res.status(404).send('User not found');
        } else {
            res.status(200).json(user);
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
