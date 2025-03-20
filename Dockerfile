FROM node:20-alpine

# Install PM2 globally
RUN npm install -g pm2

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Generate Prisma client and run migrations
RUN pnpm prisma generate && pnpm prisma migrate deploy

# Build the application
RUN pnpm build

# Expose the port your app runs on
EXPOSE 3000

# Start PM2 with ecosystem config
CMD ["pm2-runtime", "ecosystem.config.js"] 