import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
    server: {
        host: "::",
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:8080",
                changeOrigin: true,
                configure(proxy) {
                    proxy.on("proxyReq", (proxyReq) => {
                        proxyReq.setHeader(
                            "X-Forwarded-Host",
                            "localhost:5173"
                        );
					});
				},
            },
            "/oauth2": {
                target: "http://localhost:8080",
                changeOrigin: true,
                // 여기만 추가
                configure(proxy) {
                    proxy.on("proxyReq", (proxyReq) => {
                        proxyReq.setHeader(
                            "X-Forwarded-Host",
                            "localhost:5173"
                        );
                    });
                },
            },
            "/login/oauth2": {
                target: "http://localhost:8080",
                changeOrigin: true,
                configure(proxy) {
                    proxy.on("proxyReq", (proxyReq) => {
                        proxyReq.setHeader(
                            "X-Forwarded-Host",
                            "localhost:5173"
                        );
                    });
                },
            },
        },
    },
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
