# Stage 1: Builder (Đóng gói mã nguồn React)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Khai báo để Docker nhận biến từ docker-compose hoặc lệnh build
ARG VITE_API_URL
# Bơm biến này vào môi trường để lệnh build của Vite đọc được và nhét cứng (bake) vào mã tĩnh
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Production (Phục vụ file tĩnh bằng Nginx)
FROM nginx:alpine
# Lấy thành quả (thư mục dist) từ Stage 1 mang sang Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
