const request = require('supertest');
const app = require('../app');

describe('健康检查 API', () => {
    test('GET /api/health 应该返回 200 和正常状态', async () => {
        const response = await request(app)
            .get('/api/health')
            .expect(200)
            .expect('Content-Type', /json/);

        expect(response.body).toHaveProperty('status', 'OK');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('environment');
    });
});

describe('404 错误处理', () => {
    test('访问不存在的路由应该返回 404', async () => {
        const response = await request(app)
            .get('/api/nonexistent')
            .expect(404)
            .expect('Content-Type', /json/);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message');
    });
});
