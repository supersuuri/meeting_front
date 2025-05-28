FROM node:alpine3.21
WORKDIR /app
COPY package.json ./ 
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build   # <--- Build Next.js app here
EXPOSE 3000
CMD [ "npm", "run", "start" ]
