FROM node:current-alpine3.17

WORKDIR /app
COPY ./srcs/ .
RUN npm install

CMD npx prisma db push && npm run start