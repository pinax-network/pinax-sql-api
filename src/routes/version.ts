import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/valibot'
import * as v from 'valibot'
import { APP_VERSION } from '../config.js'

const route = new Hono();

const responseSchema = v.object({
    version: v.string(),
    commit: v.string(),
});

const openapi = describeRoute({
    description: 'Get the version of the API',
    tags: ['Monitoring'],
    responses: {
        200: {
            description: 'Successful Response',
            content: {
                'application/json': { schema: resolver(responseSchema), example: {
                    version: APP_VERSION.version,
                    commit: APP_VERSION.commit,
                } },
            },
        },
    },
})

route.get('/version', openapi, (c) => {
    return c.json(APP_VERSION)
});

export default route;