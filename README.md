# 截码战 Decrypto

基于桌游 [Decrypto](https://boardgamegeek.com/boardgame/225413/decrypto) 的 Web 版实现，玩家队（2 人本地同屏）对战由 DeepSeek LLM 驱动的 AI 队。

## 游戏规则

- 双方各持 4 个秘密关键词（编号 1-4），对方不可见
- 每轮系统抽取一个 3 位密码（如 2-4-1）
- **加密者** 根据密码为对应关键词各给出一条线索
- **接收者** 根据线索猜测己方密码，同时尝试拦截对手密码
- 成功拦截对手 **2 次** → 获胜；己方沟通失败 **2 次** → 失败
- 8 轮结束后以拦截次数定胜负

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 7 |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand |
| 动画 | Framer Motion |
| AI | DeepSeek API（浏览器直连） |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

启动后打开浏览器访问 `http://localhost:5173`，输入 DeepSeek API Key 即可开始游戏。

## 项目结构

```
src/
├── components/        # UI 组件
│   ├── HomePage.tsx       # 欢迎页 & 规则说明
│   ├── GameBoard.tsx      # 游戏主面板 & 阶段流转
│   ├── Header.tsx         # 顶部导航 & 密码卡
│   ├── ScoreBoard.tsx     # 双方计分板
│   ├── ClueInput.tsx      # 加密者线索输入
│   ├── CodeGuess.tsx      # 密码猜测选择器
│   ├── PhaseResultCard.tsx# 阶段结果展示
│   ├── RoundHistory.tsx   # 历史记录 & 回合详情
│   ├── GameOverModal.tsx  # 游戏结束弹窗
│   └── RoleBadge.tsx      # 角色标签组件
├── services/
│   ├── deepseekApi.ts     # DeepSeek API 调用
│   └── aiPlayer.ts        # AI 加密/猜测/拦截逻辑
├── store/
│   └── gameStore.ts       # Zustand 全局状态
├── types/
│   └── game.ts            # TypeScript 类型定义
├── utils/
│   ├── gameLogic.ts       # 核心游戏逻辑
│   └── wordList.ts        # 中文词库（360+）
├── App.tsx
└── index.css
```

## 特性

- **本地同屏对战** — 加密者出题时自动模糊屏幕，确认接收者回避后才展示内容
- **AI 独立思考** — 加密者与接收者使用独立上下文，不共享信息
- **Thinking 模式** — 可选启用 `deepseek-reasoner` 深度推理模型
- **点选式密码输入** — 三个独立数字选择器，无需手动输入
- **历史复盘** — 点击历史回合查看完整的 AI 推理过程
- **API Key 持久化** — 自动保存在浏览器 localStorage

## 许可

MIT
