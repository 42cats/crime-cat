#!/bin/sh

# nodemon 전역 설치
npm install -g nodemon

# 프로젝트 의존성 설치
npm install

# deploy.js 실행
node deploy.js

# main.js를 nodemon으로 포그라운드에서 실행
nodemon --legacy-watch main.js

