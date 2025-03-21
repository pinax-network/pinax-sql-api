import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/valibot'
import client from '../clickhouse/client.js'
import { APIErrorResponse } from '../utils.js'
import { z } from 'zod'

const route = new Hono();

const errorSchema = z.object({
    status: z.number(),
    code: z.string(),
    message: z.string(),
});

const openapi = describeRoute({
    description: 'Get health status of the API',
    tags: ['Monitoring'],
    responses: {
        200: {
            description: 'Successful Response',
            content: {
                'text/plain': { schema: resolver(v.string()), example: 'OK' },
            },
        },
        403: {
            description: 'Authentication Failed',
            content: { 'application/json': { schema: resolver(errorSchema), example: {status: 403, code: 'authentication_failed' } } }
        },
        502: {
            description: 'Connection Refused',
            content: { 'application/json': { schema: resolver(errorSchema), example: {status: 502, code: 'connection_refused'} } }
        },
        500: {
            description: 'Database Error',
            content: { 'application/json': { schema: resolver(errorSchema), example: {status: 500, code: 'bad_database_response'} } }
        },
    },
})

route.get('/health', openapi, async (c) => {
    const response = await client().ping();
    if (!response.success) {
        const message = JSON.parse(response.error.message);
        if (message.code === 516) return APIErrorResponse(c, 403, 'authentication_failed', response.error.message);
        else if (message.code === 'ConnectionRefused') return APIErrorResponse(c, 502, 'connection_refused', response.error.message);
        return APIErrorResponse(c, 500, 'bad_database_response', response.error.message);
    }
    return new Response("OK");
});

export default route;