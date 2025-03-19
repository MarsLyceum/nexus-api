import { Request, Response } from 'express';
import { UserEntity, DeleteUserParams } from 'user-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

// eslint-disable-next-line @typescript-eslint/require-await
export const deleteUser = async (
    req: Request<DeleteUserParams>,
    res: Response
    // eslint-disable-next-line consistent-return
) => {
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
            return;
        }

        await dataSource.manager.remove(user);

        res.status(204).send();
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
