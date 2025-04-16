FROM node:18-alpine

WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --legacy-peer-deps

# 复制所有文件
COPY . .

# 构建应用
RUN npm run build

# 设置环境变量
ENV NODE_ENV production
ENV PORT 3000

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]