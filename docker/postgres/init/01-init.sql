-- TravelApp データベース初期化スクリプト
-- PostgreSQL 15+

-- データベースが既に存在する場合はスキップ
SELECT 'CREATE DATABASE travelapp'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'travelapp')\gexec

-- 拡張機能の有効化
\c travelapp

-- UUID生成用拡張
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 全文検索用拡張（将来的に使用可能）
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- PostGIS（位置情報機能、必要に応じて）
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- 初期化完了メッセージ
SELECT 'TravelApp database initialized successfully!' AS status;
