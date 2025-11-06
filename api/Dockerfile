FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# If a lockfile exists prefer `npm ci`, otherwise fall back to `npm install`.
# Use `--omit=dev` to exclude devDependencies in modern npm.
RUN if [ -f package-lock.json ]; then \
			npm ci --omit=dev --no-audit --no-fund; \
		else \
			npm install --omit=dev --no-audit --no-fund; \
		fi

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
