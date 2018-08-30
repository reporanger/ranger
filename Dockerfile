FROM mhart/alpine-node:10 as base
WORKDIR /usr/src
COPY package.json yarn.lock /usr/src/
RUN yarn --production
COPY . .

FROM mhart/alpine-node:base-10
WORKDIR /usr/src
ENV NODE_ENV="production"
COPY --from=base /usr/src .
CMD PRIVATE_KEY=$(echo $PRIVATE_KEY | base64 -d) node ./node_modules/.bin/probot run ./index.js
