import { DataSource } from 'typeorm';
import { DATA_SOURCE } from './createAppDataSource';

async function initializeDataSource() {
    const dataSource = DATA_SOURCE;
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

export const TypeOrmDataSourceSingleton = (function () {
    let dataSource: DataSource | undefined;

    return {
        async getInstance() {
            if (!dataSource) {
                dataSource = await initializeDataSource();
            }
            return dataSource;
        },
    };
})();
