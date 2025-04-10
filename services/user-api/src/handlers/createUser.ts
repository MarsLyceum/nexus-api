import { Request, Response } from 'express';
import { UserEntity, CreateUserPayload } from 'user-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const createUser = async (
    req: Request<unknown, unknown, CreateUserPayload>,
    res: Response
) => {
    try {
        const { email, username, firstName, lastName, phoneNumber } = req.body;

        console.log('req.body:', req.body);

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        const newUser = await dataSource.manager.transaction(
            async (manager) => {
                const foundUser = await manager.findOne(UserEntity, {
                    where: { email },
                });

                if (foundUser) {
                    return foundUser;
                }
                const newUserInner = manager.create(UserEntity, {
                    email,
                    username,
                    firstName,
                    lastName,
                    phoneNumber,
                });

                await manager.save(newUserInner);

                return newUserInner;
            }
        );

        console.log('newUser:', newUser);

        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
