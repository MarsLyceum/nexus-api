// tests/createPostComment.test.ts

/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable unicorn/no-useless-undefined */
import {
    TypeOrmDataSourceSingleton,
    GoogleCloudStorageSingleton,
} from 'third-party-clients';
import {
    FeedChannelPostEntity,
    FeedChannelPostCommentEntity,
    CreateFeedChannelPostCommentPayload,
} from 'group-api-client';

import { createPostComment } from '../../src/handlers/createPostComment';
import { makeReq, makeRes } from '../utils';

describe('createPostComment handler', () => {
    let fakeManager: {
        findOne: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
    };
    let bucketMock: jest.Mock;
    let fakeFile: { save: jest.Mock };

    beforeEach(() => {
        jest.resetAllMocks();

        // mock out cloud storage
        fakeFile = { save: jest.fn().mockResolvedValue(undefined) };
        const fakeBucket = { file: jest.fn().mockReturnValue(fakeFile) };
        bucketMock = jest.fn().mockReturnValue(fakeBucket);
        (GoogleCloudStorageSingleton.getInstance).mockReturnValue({
            bucket: bucketMock,
        });

        // mock out TypeORM data source
        fakeManager = {
            findOne: jest.fn(),
            create: jest.fn((_, data) => data),
            save: jest.fn().mockResolvedValue(undefined),
        };
        const fakeDataSource = {
            manager: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/require-await
                transaction: async (cb: any) => cb(fakeManager),
            },
        };
        (TypeOrmDataSourceSingleton.getInstance).mockResolvedValue(
            fakeDataSource
        );
    });

    it('creates a comment without attachments or parentComment and returns 201', async () => {
        fakeManager.findOne.mockResolvedValueOnce({
            id: 'post1',
        } as FeedChannelPostEntity);

        const payload: CreateFeedChannelPostCommentPayload = {
            content: 'Hello comment',
            postedByUserId: 'user1',
            postId: 'post1',
            hasChildren: false,
        };
        const req = makeReq(payload);
        const res = makeRes();

        await createPostComment(req, res);

        expect(bucketMock).not.toHaveBeenCalled();
        expect(fakeManager.create).toHaveBeenCalledWith(
            FeedChannelPostCommentEntity,
            expect.objectContaining({
                content: 'Hello comment',
                postedByUserId: 'user1',
                postId: 'post1',
                attachmentFilePaths: [],
                parentComment: null,
                parentCommentId: null,
                upvotes: 0,
            })
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ content: 'Hello comment' })
        );
    });

    it('uploads attachments before saving and returns 201', async () => {
        fakeManager.findOne.mockResolvedValueOnce({
            id: 'post1',
        } as FeedChannelPostEntity);

        const files = {
            attachments: [
                { buffer: Buffer.from('a'), mimetype: 'image/png' },
                { buffer: Buffer.from('b'), mimetype: 'image/jpeg' },
            ],
        };
        const req = makeReq(
            { content: '', postedByUserId: 'user1', postId: 'post1' },
            files
        );
        const res = makeRes();

        await createPostComment(req, res);

        expect(bucketMock).toHaveBeenCalledWith('nexus-comment-attachments');
        const fakeBucket = bucketMock('nexus-comment-attachments');
        expect(fakeBucket.file).toHaveBeenCalledTimes(2);
        expect(fakeBucket.file).toHaveBeenNthCalledWith(
            1,
            expect.stringMatching(/^\d+_0$/)
        );
        expect(fakeBucket.file).toHaveBeenNthCalledWith(
            2,
            expect.stringMatching(/^\d+_1$/)
        );
        expect(fakeFile.save).toHaveBeenNthCalledWith(
            1,
            Buffer.from('a'),
            expect.objectContaining({ metadata: { contentType: 'image/png' } })
        );
        expect(fakeFile.save).toHaveBeenNthCalledWith(
            2,
            Buffer.from('b'),
            expect.objectContaining({ metadata: { contentType: 'image/jpeg' } })
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 404 when the post does not exist', async () => {
        fakeManager.findOne.mockResolvedValueOnce(null);

        const req = makeReq({
            content: '',
            postedByUserId: 'user1',
            postId: 'missing',
        });
        const res = makeRes();

        await createPostComment(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Post not found' });
    });

    it('returns 404 when the parent comment does not exist', async () => {
        fakeManager.findOne
            .mockResolvedValueOnce({ id: 'post1' } as FeedChannelPostEntity)
            .mockResolvedValueOnce(null); // for parent lookup

        const payload: CreateFeedChannelPostCommentPayload = {
            content: '',
            postedByUserId: 'user1',
            postId: 'post1',
            parentCommentId: 'badParent',
            hasChildren: false,
        };
        const req = makeReq(payload);
        const res = makeRes();

        await createPostComment(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Parent comment not found',
        });
    });

    it('handles unexpected errors with 500', async () => {
        (
            TypeOrmDataSourceSingleton.getInstance
        ).mockRejectedValueOnce(new Error('database down'));
        const req = makeReq({
            content: '',
            postedByUserId: 'user1',
            postId: 'post1',
        });
        const res = makeRes();

        await createPostComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('database down');
    });

    it('sets hasChildren on the parent comment and saves it', async () => {
        // stub post exists
        const existingPost = { id: 'post1' } as FeedChannelPostEntity;
        // stub parent comment exists, initially hasChildren = false
        const existingParent = new FeedChannelPostCommentEntity();
        existingParent.id = 'pc1';
        existingParent.hasChildren = false;

        // first findOne → post, second → parentComment
        fakeManager.findOne
            .mockResolvedValueOnce(existingPost)
            .mockResolvedValueOnce(existingParent);

        const payload: CreateFeedChannelPostCommentPayload = {
            content: 'This is a reply',
            postedByUserId: 'user2',
            postId: 'post1',
            parentCommentId: 'pc1',
            hasChildren: false,
        };
        const req = makeReq(payload);
        const res = makeRes();

        await createPostComment(req, res);

        // should have created & saved the new comment first...
        expect(fakeManager.save).toHaveBeenCalledWith(
            expect.objectContaining({ content: 'This is a reply' })
        );
        // ...then updated parentComment.hasChildren = true and saved it
        expect(existingParent.hasChildren).toBe(true);
        expect(fakeManager.save).toHaveBeenNthCalledWith(2, existingParent);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ content: 'This is a reply' })
        );
    });
});
