import { Request, Response } from 'express';
import { UserEntity, SearchForUsersParams } from 'user-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const searchForUsers = async (
    req: Request<SearchForUsersParams>,
    res: Response
) => {
    try {
        const { searchQuery } = req.params;

        if (!searchQuery) {
            res.status(400).send('Search query parameter is missing');
            return;
        }

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        // Replace underscores/hyphens with spaces first
        // eslint-disable-next-line unicorn/prefer-string-replace-all
        const normalized = searchQuery
            // eslint-disable-next-line unicorn/prefer-string-replace-all
            .replace(/[_-]+/g, ' ')
            // eslint-disable-next-line unicorn/prefer-string-replace-all
            .replace(/([\da-z])([A-Z])/g, '$1 $2');

        // Extract tokens using a regex that captures acronyms, words, and numbers.
        const terms =
            normalized.match(/([A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|\d+)/g) || [];

        // Create the query builder for UserEntity.
        let query = dataSource.manager.createQueryBuilder(UserEntity, 'user');

        // Array to collect individual similarity score expressions.
        const scoreComponents: string[] = [];

        // For each token, add a similarity score expression and set the corresponding parameter.
        // Note: We're using the raw term (without wildcards) for similarity calculations.
        terms.forEach((term, index) => {
            // Set the parameter for similarity (raw token).
            query = query.setParameter(`term${index}`, term);

            // Build a similarity score expression for this token across several fields.
            const scoreExpr = `(similarity(user.username, :term${index}) +
                      similarity(user.firstName, :term${index}) +
                      similarity(user.lastName, :term${index}))`;
            scoreComponents.push(scoreExpr);
        });

        // Combine all individual score expressions into one total score.
        const totalScoreExpr = scoreComponents.join(' + ');

        // Add the computed total similarity score to the select clause.
        query = query.addSelect(totalScoreExpr, 'totalscore');

        // Optionally, filter out records with no similarity at all.
        query = query.where(`${totalScoreExpr} > 0`);

        // Order the results by the total similarity score in descending order.
        query = query.orderBy('totalscore', 'DESC');

        // Execute the query to get the list of users.
        const users = await query.getMany();

        if (!users) {
            res.status(404).send('Users not found');
        } else {
            res.status(200).json(users);
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
