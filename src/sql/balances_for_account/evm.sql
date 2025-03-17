SELECT
    block_num,
    toUnixTimestamp(timestamp) as timestamp,
    date,
    CAST(contract, 'String') AS contract,
    CAST(new_balance, 'String') AS amount,
    multiIf(
        contract = 'native' AND chain_id IN ('mainnet','arbitrum-one','base','bnb','matic'), 18,
        contracts.decimals
    ) AS decimals,
    multiIf(
        contract = 'native' AND chain_id = 'mainnet', 'ETH',
        contract = 'native' AND chain_id = 'arbitrum-one', 'ETH',
        contract = 'native' AND chain_id = 'base', 'ETH',
        contract = 'native' AND chain_id = 'bnb', 'BNB',
        contract = 'native' AND chain_id = 'matic', 'POL',
        contracts.symbol
    ) AS symbol,
    {chain_id: String} as chain_id
FROM balances FINAL
LEFT JOIN contracts
    ON balances.contract = contracts.address
WHERE
    owner = {address: String} AND new_balance > 0
ORDER BY block_num DESC;