Develop a full-stack web application named “book-trash” as an AI-powered learning assistant to help users efficiently learn technical topics. Users can input a technology name or documentation URL (e.g., https://langchain-ai.github.io/langgraph/), and the app uses AI to process the document, extract key points, generate personalized learning paths, and provide interactive teaching features. No user login is required; only a large language model API key needs to be configured for use. **Unit tests are not required**, with priorities as follows: AI workflow (highest) > backend API > frontend UI (basic framework).

### Technology Stack:
- **Backend**: Use Node.js and NestJS framework, based on TypeScript. Handle API endpoints for document processing, AI interactions, and session management. Use TypeORM as the ORM tool for SQLite database migrations and model definitions.
- **Frontend**: Use Vue.js (Vue 3, Composition API). Use Vue Router for navigation, Pinia for state management, and Axios for API calls. Create a responsive UI with components for input forms, display panels, chat interfaces, and quizzes. Use Element Plus for loading components (e.g., v-loading).
- **AI Integration**: **Highest priority**, use LangChain.js and LangGraph.js to build an intelligent learning agent. The agent operates via a task chain (e.g., document loading, summarization, key point extraction, learning path generation, interactive Q&A). Integrate a large language model API (e.g., OpenAI or Grok API) via LangChain.js. Use LangGraph.js to model the agent workflow as a graph with nodes:
  - “Parse Document”: Use WebBaseLoader to load content.
  - “Extract Key Points”: Prompt: "Extract core concepts and brief descriptions from the document: {content}".
  - “Generate Path”: Prompt: "Generate a learning path based on user level {level}, including steps, estimated time, and code examples: {keys}".
  - “Interactive Quiz”: Prompt: "Generate multiple-choice quiz questions based on key points: {keys}".
  - “Q&A Handler”: Prompt: "Answer user questions based on the document and session history: {question}, history: {history}".
- **Database**: Use SQLite to store user learning progress, session data, and cached AI responses. Use TypeORM to define models: LearningSession table (fields: id: string (UUID), url: string, userLevel: string, summary: text, keys: json, path: json, quiz: json, dialogHistory: json array, createdAt: timestamp).
- **Other**: Backend只需 handle CORS in the backend, use dotenv to manage environment variables (e.g., API key). Ensure a deployable structure with separated frontend and backend. Add a global error handling middleware (e.g., NestJS ExceptionFilter) to return friendly JSON responses (e.g., {error: "Unable to access URL"}).

### Core Features (By Priority):
1. **User Input** (High Priority):
   - Frontend form for entering technology name, URL, and user level (beginner/advanced), sent via POST /api/learn.
   - **API Contract**:
     - Request: `POST /api/learn {url: string, level: string (beginner/advanced)}`
     - Response: `{sessionId: string, summary: string, keys: array, path: array}`
   - Backend validates URL (using validator.js), returning 400 for invalid URLs.
2. **Document Parsing** (High Priority):
   - Backend uses LangChain.js WebBaseLoader to parse web content. Return {error: "Unable to load document"} on failure.
3. **AI Agent Workflow** (Highest Priority, Full Implementation Required):
   - Use LangGraph.js to build a graph with nodes as described, edges connecting sequentially (parse->extract->path->quiz), with conditional edges for Q&A (route to Q&A node if question exists).
   - Use LangChain.js LLMChain or AgentExecutor for prompts, supporting personalization (simplified for beginners, detailed for advanced).
   - First request: Generate UUID sessionId, store in LearningSession table, return to frontend.
4. **Output** (High Priority):
   - Summary and key points in JSON: `{summary: string, keys: [{concept: string, description: string}]}`
   - Learning path: JSON array, e.g., `[{step: string, time: string, code: string}]`
   - Interactive features:
     - Real-time chat: Frontend sends `POST /api/ask {sessionId: string, question: string}`, backend responds `{answer: string}`
     - Quiz: Frontend sends `POST /api/quiz-answer {sessionId: string, answer: string}`, backend responds `{correct: boolean, explanation: string}`
5. **Frontend UI** (Low Priority, Basic Framework Only):
   - Home: Input form (technology name, URL, level dropdown).
   - Dashboard: Display summary (text), key points (list), learning path (accordion), quiz (modal).
   - Chat component: Simple input box and message list for Q&A.
   - Loading state: Use v-loading during API requests.
   - Pinia: learningStore (sessionId, dialogHistory), uiStore (loading: boolean, error: string).
   - Session persistence: Frontend stores sessionId locally, retrieves via /api/session/{id}.
6. **Configuration**: Configure large language model API key via .env (OPENAI_API_KEY=your_key).
7. **Error Handling**:
   - Backend: Global middleware for exceptions, returning JSON like `{statusCode: number, error: string}`.
   - Frontend: Axios interceptor for errors, displaying toast messages (e.g., “Unable to access URL”).
8. **Example Flow**: User inputs LangGraph URL → Backend creates sessionId, processes document → Frontend saves ID, displays summary, key points (e.g., Graphs, Nodes), path (Step 1: Quickstart), quiz. Q&A and quizzes use sessionId for context.

### Project Structure:
- backend/
  - src/
    - main.ts (NestJS bootstrap)
    - app.module.ts
    - learn/ (module: controller, service with LangChain/LangGraph; endpoints: /learn, /ask, /quiz-answer, /session/:id)
    - database/ (SQLite config, TypeORM entity learning-session.entity.ts, migration scripts)
    - .env (API key)
- frontend/
  - src/
    - App.vue
    - components/ (InputForm.vue, SummaryDisplay.vue, LearningPath.vue, Chat.vue, Quiz.vue, LoadingSpinner.vue)
    - views/ (Home.vue, Dashboard.vue)
    - store/ (Pinia: learning.ts, ui.ts)
- Root: package.json with dependencies; README with setup instructions (npm install, npm run start:dev for backend, npm run serve for frontend).

Generate complete code, including all files, package.json dependencies, and setup commands (npm install, npm run start:dev for backend, npm run serve for frontend). Ensure modular code, best practices, ESLint/Prettier for style. Provide .env.example (OPENAI_API_KEY=your_key). Handle edge cases: chunk large documents, retry failed AI calls once.




### 一些目录划分建议

agents 目录用于存放agent智能体。

config 目录用于存放配置。

graph 目录用于存放langgraph的代码，定义图的结构和node节点。

llms 目录用于存放大模型，一个项目会使用多个大模型。

prompts 目录用于存放prompt提示词。

server 里面的 app.ts 就是项目的启动文件。

tools 目录用于存放agent智能体中使用的工具。

utils 目录用于存放项目中使用的工具函数。