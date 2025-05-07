import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import serveStatic from "serve-static";
import { fileURLToPath } from "node:url";
import basicSsl from "@vitejs/plugin-basic-ssl";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 루트/images 폴더
const imagesDir = path.resolve(__dirname, "..", "images");

export default defineConfig({
    server: {
        host: "::",
        port: 5173,

        // HMR용 WSS 프로토콜 명시
        hmr: {
            protocol: "wss",
            host: "localhost",
            port: 5173,
        },

        proxy: {
            "/api": {
                target: "http://localhost:8080",
                changeOrigin: true,
                configure(proxy) {
                    proxy.on("proxyReq", (pr) =>
                        pr.setHeader("X-Forwarded-Host", "localhost:5173")
                    );
                },
            },
            "/oauth2": {
                target: "http://localhost:8080",
                changeOrigin: true,
                configure(proxy) {
                    proxy.on("proxyReq", (pr) =>
                        pr.setHeader("X-Forwarded-Host", "localhost:5173")
                    );
                },
            },
            "/login/oauth2": {
                target: "http://localhost:8080",
                changeOrigin: true,
                configure(proxy) {
                    proxy.on("proxyReq", (pr) =>
                        pr.setHeader("X-Forwarded-Host", "localhost:5173")
                    );
                },
            },
            "/csrf/token": {
                target: "http://localhost:8080",
                changeOrigin: true,
                configure(proxy) {
                    proxy.on("proxyReq", (pr) =>
                        pr.setHeader("X-Forwarded-Host", "localhost:5173")
                    );
                },
            },
            // /images proxy 제거
        },
    },

    plugins: [
        // HTTPS 인증서 자동 생성
        basicSsl(),

        react(),

        // local-images 정적 미들웨어
        {
            name: "local-images-middleware",
            configureServer(server) {
                server.middlewares.use("/images", serveStatic(imagesDir));
            },
        },
    ],

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
