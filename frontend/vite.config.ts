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
    // 이미지 최적화 설정
    assetsInlineLimit: 4096, // 4KB 이하 파일은 base64로 인라인화
    
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

    build: {
        // 번들 크기 분석
        reportCompressedSize: true,
        
        // 이미지 최적화
        rollupOptions: {
            output: {
                // 에셋 파일 이름 패턴 (캐싱 최적화)
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name?.split('.') || [];
                    const ext = info[info.length - 1];
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                        return `assets/images/[name]-[hash][extname]`;
                    }
                    return `assets/[name]-[hash][extname]`;
                },
            },
        },
    },

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
