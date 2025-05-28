FROM scratch
ADD alpine-minirootfs-3.20.6-x86_64.tar.gz /
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 3000
CMD [ "npm", "run", "start" ]