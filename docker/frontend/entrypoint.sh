#!/bin/sh
# entrypoint.sh

# 안전하게 npm install + build 진행
npm install
npm run build

# 추가로 서버도 띄울거면 (ex. next.js, vite preview, express 등)
# npm run start
