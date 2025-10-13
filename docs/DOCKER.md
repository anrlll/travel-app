# Docker構成ガイド

## 概要

TravelAppの開発環境ではDocker Composeを使用してPostgreSQLデータベースを管理します。

## サービス構成

### 1. PostgreSQL 15
- **イメージ**: `postgres:15-alpine`
- **ポート**: `5432`
- **データベース名**: `travelapp`
- **ユーザー名**: `travelapp`
- **パスワード**: `travelapp_dev_password`（開発環境のみ）

### 2. pgAdmin（オプション）
- **イメージ**: `dpage/pgadmin4:latest`
- **ポート**: `5050`
- **URL**: http://localhost:5050
- **ログイン情報**:
  - Email: `admin@travelapp.local`
  - Password: `admin`

## 起動方法

### PostgreSQLのみ起動
```bash
docker-compose up -d postgres
```

### 管理ツール込みで起動
```bash
docker-compose --profile tools up -d
```

### Makefileを使用（推奨）
```bash
make up         # PostgreSQLのみ
make up-tools   # PostgreSQL + pgAdmin
```

## データ永続化

Docker volumeを使用してデータを永続化します：
- `postgres_data`: PostgreSQLのデータディレクトリ
- `pgadmin_data`: pgAdminの設定データ

## 初期化スクリプト

`docker/postgres/init/01-init.sql`が自動実行され、以下を設定します：
- データベース作成
- 拡張機能の有効化（uuid-ossp、pg_trgm）

## よく使うコマンド

### コンテナ操作
```bash
# コンテナ起動
docker-compose up -d

# コンテナ停止
docker-compose down

# コンテナ再起動
docker-compose restart

# ログ表示
docker-compose logs -f postgres

# コンテナ状態確認
docker-compose ps
```

### データベース操作
```bash
# PostgreSQLコンテナに接続
docker-compose exec postgres psql -U travelapp -d travelapp

# データベースバックアップ
docker-compose exec postgres pg_dump -U travelapp travelapp > backup.sql

# データベースリストア
docker-compose exec -T postgres psql -U travelapp travelapp < backup.sql
```

### データリセット
```bash
# データボリューム込みで削除（全データ削除）
docker-compose down -v

# 再起動
docker-compose up -d
```

## pgAdmin接続設定

1. http://localhost:5050 にアクセス
2. ログイン（admin@travelapp.local / admin）
3. 「Add New Server」をクリック
4. 以下の情報を入力：

**General タブ**:
- Name: `TravelApp`

**Connection タブ**:
- Host: `postgres`（コンテナ名）
- Port: `5432`
- Maintenance database: `travelapp`
- Username: `travelapp`
- Password: `travelapp_dev_password`

## トラブルシューティング

### ポート5432が使用中
```bash
# 既存のPostgreSQLを停止
sudo systemctl stop postgresql

# またはdocker-compose.ymlでポート変更
ports:
  - "5433:5432"  # 5433に変更
```

### データが表示されない
```bash
# Prismaマイグレーションを実行
cd backend
npm run prisma:migrate
```

### コンテナが起動しない
```bash
# ログを確認
docker-compose logs postgres

# コンテナとボリュームを削除して再作成
docker-compose down -v
docker-compose up -d
```

### 権限エラー
```bash
# Dockerボリュームの権限を確認
docker-compose exec postgres ls -la /var/lib/postgresql/data
```

## 本番環境との違い

| 項目 | 開発環境（Docker） | 本番環境（VPS） |
|------|------------------|----------------|
| PostgreSQL | Dockerコンテナ | VPS上に直接インストール |
| ポート | localhost:5432 | VPS IP:5432（外部公開しない） |
| パスワード | 簡易的 | 強固なパスワード |
| バックアップ | 手動 | 自動化（cron） |
| 管理ツール | pgAdmin | Prisma Studio / psql |

## セキュリティ注意事項

⚠️ **開発環境専用の設定です。本番環境では以下を変更してください**:
- データベースパスワードを強固なものに変更
- pgAdminの認証情報を変更
- PostgreSQLポートを外部に公開しない
- 環境変数を`.env`ファイルで管理（Gitにコミットしない）

## 参考リンク

- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/15/)
- [pgAdmin公式ドキュメント](https://www.pgadmin.org/docs/)
- [Docker Compose公式ドキュメント](https://docs.docker.com/compose/)
