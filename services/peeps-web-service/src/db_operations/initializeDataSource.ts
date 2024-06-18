import { createAppDataSource } from '../db_connection/createAppDataSource';

export async function initializeDataSource() {
    const dataSource = createAppDataSource();
    try {
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }
        return dataSource;
    } catch (error) {
        console.log('error:', error);
    }

    return dataSource;
}
