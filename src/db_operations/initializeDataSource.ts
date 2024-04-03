import { createAppDataSource } from '../db_connection/createAppDataSource';

export async function initializeDataSource() {
    const dataSource = await createAppDataSource();
    try {
        await dataSource.initialize();
        return dataSource;
    } catch (error) {
        console.log('error:', error);
    }

    return dataSource;
}
