import { Request, Response } from 'express';
import { UserEntity, CreateUserPayload } from 'user-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const createUser = async (
    req: Request<unknown, unknown, CreateUserPayload>,
    res: Response
) => {
    try {
        const { email, username, firstName, lastName, phoneNumber } = req.body;

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        const foundUser =
            (await dataSource.manager.findOne(UserEntity, {
                where: { email },
            })) ?? undefined;

        if (foundUser) {
            res.status(400).json({ message: 'User already exists' });
        } else {
            const newUser = dataSource.manager.create(UserEntity, {
                email,
                username,
                firstName,
                lastName,
                phoneNumber,
            });

            await dataSource.manager.save(newUser);

            res.status(201).json(newUser);
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
