.PHONY: help setup up down restart logs db-migrate db-reset db-studio install dev build clean

# デフォルトターゲット
help:
	@echo "TravelApp 開発コマンド"
	@echo ""
	@echo "セットアップ:"
	@echo "  make setup        - 初回セットアップ（Docker起動 + 依存関係インストール + DBマイグレーション）"
	@echo "  make install      - 依存関係のインストール"
	@echo ""
	@echo "Docker操作:"
	@echo "  make up           - Dockerコンテナ起動（PostgreSQL）"
	@echo "  make down         - Dockerコンテナ停止"
	@echo "  make restart      - Dockerコンテナ再起動"
	@echo "  make logs         - Dockerログ表示"
	@echo "  make up-tools     - 管理ツール込みで起動（pgAdmin含む）"
	@echo ""
	@echo "データベース:"
	@echo "  make db-migrate   - Prismaマイグレーション実行"
	@echo "  make db-reset     - データベースリセット（全データ削除）"
	@echo "  make db-studio    - Prisma Studio起動"
	@echo "  make db-seed      - シードデータ投入"
	@echo ""
	@echo "開発:"
	@echo "  make dev          - 開発サーバー起動（フロントエンド + バックエンド）"
	@echo "  make dev-frontend - フロントエンドのみ起動"
	@echo "  make dev-backend  - バックエンドのみ起動"
	@echo ""
	@echo "ビルド・テスト:"
	@echo "  make build        - プロダクションビルド"
	@echo "  make test         - テスト実行"
	@echo "  make lint         - リント実行"
	@echo ""
	@echo "クリーンアップ:"
	@echo "  make clean        - node_modules と Docker volumes を削除"

# 初回セットアップ
setup:
	@echo "📦 初回セットアップを開始します..."
	@make up
	@echo "⏳ PostgreSQLの起動を待っています..."
	@sleep 5
	@make install
	@make db-migrate
	@echo "✅ セットアップ完了！"
	@echo ""
	@echo "次のコマンドで開発サーバーを起動できます:"
	@echo "  make dev"

# 依存関係インストール
install:
	@echo "📦 依存関係をインストールしています..."
	npm run install:all

# Docker起動
up:
	@echo "🐳 Dockerコンテナを起動しています..."
	docker-compose up -d postgres
	@echo "✅ PostgreSQLが起動しました（ポート: 5432）"

# 管理ツール込みで起動
up-tools:
	@echo "🐳 Dockerコンテナを起動しています（管理ツール含む）..."
	docker-compose --profile tools up -d
	@echo "✅ PostgreSQL (5432) と pgAdmin (5050) が起動しました"
	@echo "📊 pgAdmin: http://localhost:5050"
	@echo "   Email: admin@travelapp.local"
	@echo "   Password: admin"

# Docker停止
down:
	@echo "🛑 Dockerコンテナを停止しています..."
	docker-compose down

# Docker再起動
restart:
	@echo "🔄 Dockerコンテナを再起動しています..."
	docker-compose restart

# Dockerログ表示
logs:
	docker-compose logs -f

# Prismaマイグレーション
db-migrate:
	@echo "🗄️  Prismaマイグレーションを実行しています..."
	cd backend && npm run prisma:generate && npm run prisma:migrate

# データベースリセット
db-reset:
	@echo "⚠️  データベースをリセットします（全データ削除）"
	@read -p "本当に実行しますか？ (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	cd backend && npx prisma migrate reset --force

# Prisma Studio起動
db-studio:
	@echo "📊 Prisma Studioを起動しています..."
	cd backend && npm run prisma:studio

# シードデータ投入（今後実装）
db-seed:
	@echo "🌱 シードデータを投入しています..."
	cd backend && npx prisma db seed

# 開発サーバー起動
dev:
	@echo "🚀 開発サーバーを起動しています..."
	npm run dev

dev-frontend:
	@echo "🚀 フロントエンドを起動しています..."
	npm run dev:frontend

dev-backend:
	@echo "🚀 バックエンドを起動しています..."
	npm run dev:backend

# ビルド
build:
	@echo "🔨 プロダクションビルドを実行しています..."
	npm run build

# テスト
test:
	@echo "🧪 テストを実行しています..."
	cd backend && npm run test
	cd frontend && npm run test

# リント
lint:
	@echo "🔍 リントを実行しています..."
	npm run lint

# クリーンアップ
clean:
	@echo "🧹 クリーンアップを実行しています..."
	@read -p "node_modules と Docker volumes を削除します。よろしいですか？ (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	rm -rf node_modules frontend/node_modules backend/node_modules
	rm -rf frontend/dist backend/dist
	docker-compose down -v
	@echo "✅ クリーンアップ完了"
