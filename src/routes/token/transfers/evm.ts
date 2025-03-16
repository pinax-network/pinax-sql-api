import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';
import * as v from 'valibot';
import { makeUsageQuery } from '../../../handleQuery.js';
import { chainIdSchema, EvmAddressSchema, metaSchema, parseEvmAddress } from '../../../types/valibot.js';
import { EVM_SUBSTREAMS_VERSION } from '../index.js';

const route = new Hono();

const paramSchema = v.object({
    address: EvmAddressSchema,
});

const querySchema = v.object({
    chain_id: chainIdSchema,
});

const responseSchema = v.object({
    data: v.array(v.object({
        timestamp: v.number(),
        date: v.string(),
        contract: EvmAddressSchema,
        from: EvmAddressSchema,
        to: EvmAddressSchema,
        value: v.string(),
    })),
    meta: v.optional(metaSchema),
});

const openapi = describeRoute({
    description: 'Token Transfers by Wallet Address',
    tags: ['EVM'],
    security: [{ ApiKeyAuth: [] }],
    responses: {
        200: {
            description: 'Successful Response',
            content: {
                'application/json': {
                    schema: resolver(responseSchema), example: {
                        data: [
                            {
                                "contract": "0x27695e09149adc738a978e9a678f99e4c39e9eb9",
                                "from": "0x2b5634c42055806a59e9107ed44d43c426e58258",
                                "to": "0xa78c4208fe4fedd86fc90fad93d6fb154c3936a4",
                                "value": "8000000000000",
                                "timestamp": 1529002377,
                                "date": "2018-06-14"
                            }
                        ]
                    }
                },
            },
        }
    },
});

route.get('/:address', openapi, validator('param', paramSchema), validator('query', querySchema), async (c) => {
    const chain_id = c.req.query("chain_id");
    const address = parseEvmAddress(c.req.param("address"));
    if (!address) return c.json({ error: 'invalid EVM address' }, 400);

    const TABLE = `${chain_id}:${EVM_SUBSTREAMS_VERSION}`;
    const query = `
    SELECT
        contract,
        from,
        to,
        CAST(value, 'String') AS value,
        toUnixTimestamp(timestamp) as timestamp,
        date
    FROM "${TABLE}".transfers
    WHERE from = {address: String} OR to = {address: String}
    ORDER BY block_num DESC`;
    return makeUsageQuery(c, [query], { address });
});

export default route;