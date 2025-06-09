import { TypeOrmDataSourceSingleton } from 'third-party-clients';
import { TextChannelMessageEntity } from 'group-api-client';
import { makeReq, makeRes } from '../utils';
import { updateTextChannelMessage } from '../../src/handlers/updateTextChannelMessage';

describe('updateTextChannelMessage handler', () => {
    let fakeManager: {
        update: jest.Mock<
            Promise<unknown>,
            [
                typeof TextChannelMessageEntity,
                Partial<TextChannelMessageEntity>,
                Partial<TextChannelMessageEntity>,
            ]
        >;
        findOne: jest.Mock<
            Promise<TextChannelMessageEntity | null>,
            [typeof TextChannelMessageEntity, { where: { id: string } }]
        >;
    };
    let res: ReturnType<typeof makeRes>;

    beforeEach(() => {
        jest.resetAllMocks();

        fakeManager = {
            // eslint-disable-next-line unicorn/no-useless-undefined
            update: jest.fn().mockResolvedValue(undefined),
            findOne: jest.fn(),
        };

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        (TypeOrmDataSourceSingleton.getInstance as jest.Mock).mockResolvedValue(
            {
                manager: {
                    transaction: async (
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        cb: (m: typeof fakeManager) => Promise<any>
                    ) => cb(fakeManager),
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
        );

        res = makeRes();
    });

    it('updates content, marks edited, and returns the updated entity', async () => {
        const updatedMessage = {
            id: 'msg-1',
            content: 'updated text',
            edited: true,
        } as TextChannelMessageEntity;

        fakeManager.findOne.mockResolvedValue(updatedMessage);

        const req = makeReq({
            id: 'msg-1',
            content: 'updated text',
            postedByUserId: 'user-123',
        });

        await updateTextChannelMessage(req, res);

        // ensure update was called with correct where clause and payload
        expect(fakeManager.update).toHaveBeenCalledWith(
            TextChannelMessageEntity,
            { id: 'msg-1', postedByUserId: 'user-123' },
            { content: 'updated text', edited: true }
        );

        // ensure we then fetch the updated row
        expect(fakeManager.findOne).toHaveBeenCalledWith(
            TextChannelMessageEntity,
            { where: { id: 'msg-1' } }
        );

        // response should be 200 with the updated entity
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(updatedMessage);
    });

    it('logs errors and returns 500 on exception', async () => {
        const dbError = new Error('something went wrong');
        fakeManager.update.mockRejectedValue(dbError);

        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation();

        const req = makeReq({
            id: 'msg-2',
            content: 'irrelevant',
            postedByUserId: 'user-456',
        });

        await updateTextChannelMessage(req, res);

        // handler should log the error for diagnostics
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error updating text channel message:',
            dbError
        );

        // and send a 500
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Internal Server Error',
        });
    });
});
