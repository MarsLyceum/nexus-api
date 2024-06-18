import { Request, Response } from 'express';

import { User, UserIdParam } from './RequestTypes';

export const createUser = async (
    req: Request<unknown, unknown, User>,
    res: Response
    // eslint-disable-next-line @typescript-eslint/require-await
) => {
    try {
        const { name, email } = req.body;
        // TODO: Add logic to create a user in the database
        res.status(201).json({ id: 'newly-created-id', name, email });
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

// eslint-disable-next-line @typescript-eslint/require-await
export const getUser = async (req: Request<UserIdParam>, res: Response) => {
    try {
        const userId = req.params.id;
        // TODO: Add logic to retrieve a user from the database
        if (!userId) {
            res.status(404).send('User not found');
        } else {
            res.json({
                id: userId,
                name: 'Sample Name',
                email: 'Sample Email',
            });
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

export const updateUser = async (
    req: Request<UserIdParam, unknown, User>,
    res: Response
    // eslint-disable-next-line @typescript-eslint/require-await
) => {
    try {
        const userId = req.params.id;
        const { name, email } = req.body;
        // TODO: Add logic to update a user in the database
        res.json({ id: userId, name, email });
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

// eslint-disable-next-line @typescript-eslint/require-await
export const deleteUser = async (req: Request<UserIdParam>, res: Response) => {
    try {
        const userId = req.params.id;
        // TODO: Add logic to delete a user from the database
        res.status(204).send();
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
