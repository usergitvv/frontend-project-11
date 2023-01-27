install:
		npm ci

lint:
	npx eslint .

dev:
	npx webpack serve

build:
	rm -rf dist
	NODE_ENV=production NODE_OPTIONS=--openssl-legacy-provider npx webpack		

.PHONY: test
			