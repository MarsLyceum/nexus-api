import { appDataSource } from '../db_connection/appDataSource';

export async function initializeDataSource() {
    try {
        const dataSource = await appDataSource.initialize();
        return dataSource;
    } catch (error) {
        console.log('error:', error);
    }

    return appDataSource;
}
