-- Migration to initialize system ledger accounts
-- Adds two system accounts: 'system_bank_asset' and 'system_cash' of type 'asset'

INSERT INTO accounts (created_at, updated_at, deleted_at, wallet_id, code, type)
VALUES 
    (CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL, 'system_bank_asset', 'asset'),
    (CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL, 'system_cash', 'asset')
ON CONFLICT (code) DO NOTHING;
