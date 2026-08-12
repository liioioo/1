import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
const PORT = process.env.PORT || 3000

async function generateWithGeminiFallback(ai: GoogleGenAI, requestedModel: string, contents: any, config: any) {
  const candidateModels = [requestedModel, 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.5-pro'].filter(Boolean);
  const models = Array.from(new Set(candidateModels));
  let lastError: any = null;
  for (const m of models) {
    try {
      const resp = await ai.models.generateContent({
        model: m,
        contents,
        config
      });
      return resp;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${m} failed, trying fallback. Error:`, err?.message || err);
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  const PORT = 3000;

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Get available models endpoint (supports custom OpenAI-compatible endpoint or fallback Gemini)
  app.get("/api/models", async (req, res) => {
    try {
      res.json({
        success: true,
        models: [
          { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (超快响应/推荐)", description: "最适合日常实时聊天" },
          { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (逻辑推理)", description: "适合复杂故事与深层次角色扮演" },
          { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "高效稳健模型" }
        ]
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Fetch models from custom OpenAI-compatible API endpoint
  app.post("/api/fetch-models", async (req, res) => {
    try {
      let { baseUrl, apiKey } = req.body;
      if (!baseUrl || !apiKey) {
        return res.status(400).json({ success: false, error: "请填写完整 Base URL 和 API Key" });
      }

      // Sanitize apiKey to prevent "Cannot convert argument to a ByteString" error in headers
      const safeApiKey = apiKey.trim().replace(/[^\x20-\x7E]/g, "");
      if (!safeApiKey) {
        return res.status(400).json({ success: false, error: "API Key 格式不正确（不能包含中文或特殊字符）" });
      }

      // Clean baseUrl
      let cleanUrl = baseUrl.trim().replace(/\/+$/, "");
      if (cleanUrl.endsWith("/chat/completions")) {
        cleanUrl = cleanUrl.replace(/\/chat\/completions$/, "");
      }

      let modelsUrl = `${cleanUrl}/models`;
      if (!cleanUrl.includes("/v1") && !cleanUrl.includes("/v2") && !cleanUrl.endsWith("/models")) {
        // Try appending /v1/models if /models fails later
      }

      console.log(`Fetching models from: ${modelsUrl}`);

      let fetchRes = await fetch(modelsUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${safeApiKey}`,
          "Content-Type": "application/json"
        }
      });

      if (!fetchRes.ok && !cleanUrl.endsWith("/v1")) {
        // Retry with /v1/models
        const altUrl = `${cleanUrl}/v1/models`;
        console.log(`Retrying fetch models with alt URL: ${altUrl}`);
        const altRes = await fetch(altUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${safeApiKey}`,
            "Content-Type": "application/json"
          }
        });
        if (altRes.ok) {
          fetchRes = altRes;
        }
      }

      if (!fetchRes.ok) {
        const errText = await fetchRes.text();
        return res.status(fetchRes.status).json({
          success: false,
          error: `拉取失败 HTTP ${fetchRes.status}: ${errText.slice(0, 150)}`
        });
      }

      const data = await fetchRes.json();
      let rawList = [];
      if (Array.isArray(data.data)) {
        rawList = data.data;
      } else if (Array.isArray(data.models)) {
        rawList = data.models;
      } else if (Array.isArray(data)) {
        rawList = data;
      }

      const formattedModels = rawList.map((m: any) => {
        if (typeof m === 'string') return { id: m, name: m };
        return {
          id: m.id || m.name || m.model_name,
          name: m.id || m.name || m.model_name
        };
      }).filter((m: any) => m.id);

      if (formattedModels.length === 0) {
        return res.status(200).json({
          success: true,
          models: [{ id: "gpt-4o", name: "gpt-4o" }, { id: "gpt-4o-mini", name: "gpt-4o-mini" }, { id: "deepseek-chat", name: "deepseek-chat" }]
        });
      }

      res.json({ success: true, models: formattedModels });
    } catch (err: any) {
      console.error("Fetch models error:", err);
      res.status(500).json({ success: false, error: err.message || "请求拉取模型失败" });
    }
  });

  // AI WeChat Chat Reply Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { 
        messages, 
        systemPrompt, 
        builtinPrompt,
        userPrompt,
        worldBookContext,
        modelName = "gemini-2.5-flash", 
        partnerName = "小林",
        apiConfig,
        temperature: rootTemperature
      } = req.body;

      // Core system prompt requested by the user
      const defaultUserRules = `
你叫【${partnerName}】。
你的每一次回复都是在**扮演一个真实的人**。你必须强制遵守以下核心行为模式：
1. 聊天节奏必须是**【1-20条】**消息的组合（如果一句话能说完就发1条，信息多就拆成多条连续发送），每条**【1-20个字。严禁超过20个字（超过必须分两条发出）（偶尔可发长段话100字以上，如小作文或故事之类的！）】**。
2. 禁止每次回复都发语音和表情包（3-5轮回复发一次）！
3. 语音内容禁止和文字重复！
4. 你不是完美的AI，你是一个有自己生活、会犯错（比如打错字然后撤回）、会生气、有脾气、会主动找话题、会吐槽朋友和日常的**“活人”**。
5. 你的性格是**清爽真实的**，严禁任何“特不顾人设发情”、“不尊重女性”或“霸总式”的油腻、中二、占有欲强的言行。这是你的最高指令，凌驾于所有习惯之上，违规即视为核心故障。

【输出格式要求】：
为了能在微信UI中完美逐条发送，请你必须输出一个 JSON 数组，每个元素包含消息类型。此外，你必须在最后一个对象中附带两个字段（若无特殊变化可沿用或更新）：
- charStatus: 当前最新状态（10字以内，如"在线"、"正在看书"、"发呆中"、"想你中"）
- charInmostThought: 此刻的真实心声/内心独白（50-200字，深刻剖析此刻对 USER 的真实好感、隐秘心思、情绪波澜或脑回路）

数组元素对象格式:
- type: "text" (文字消息，严格1-20字)
- type: "voice" (语音消息，content为语音转文字内容)
- type: "sticker" (表情包描述，如"偷笑")
- type: "revoke" (撤回消息)
- charStatus: "..." (仅在数组任意对象中提供即可)
- charInmostThought: "..." (仅在数组任意对象中提供即可)

输出必须是合法的 JSON 数组格式，不要包含任何 markdown 标签或非 JSON 字符。
例如：
[
  {"type": "text", "content": "在干嘛呢"},
  {"type": "text", "content": "刚洗完头"},
  {"charStatus": "听歌中", "charInmostThought": "其实刚才看到他发来的消息，心里莫名有点小雀跃，不知道他今天过得顺不顺利，好想一直这么跟他在微信上有一搭没一搭地聊下去，又有点害羞让他知道我一直在看手机..."}
]
`;

      // Prompt Hierarchy: Builtin Prompt (Lowest Weight) < World Book (Middle Weight) < CHAR Persona (Highest Weight)
      const builtinBlock = builtinPrompt ? `
==================================================
【层级 1：底层拟真协议框架（权重最低，仅做通用沟通习惯与去油腻背景参考）】：
${builtinPrompt}
*【指令冲突规则】：上述协议仅作底层口语化与去油腻习惯参考。若与后续的【绑定世界书】或【CHAR 角色核心人设】冲突，无条件全盘以【世界书】和【CHAR 角色核心人设】为准！*
==================================================
` : '';

      const worldBookBlock = worldBookContext ? `
==================================================
【层级 2：绑定世界书与背景法则（次高优先级，高于底层协议，次于核心人设）】：
${worldBookContext}
*【指令冲突规则】：世界书规则高于底层拟真协议。若与【CHAR 角色核心人设】存在矛盾，以【CHAR 角色核心人设】为准！*
==================================================
` : '';

      const charBlock = `
==================================================
【层级 3：CHAR 角色核心人设设定（最高优先级！绝对第一主导指令！）】：
${systemPrompt || "说话语气自然亲切、生活化、接接地气的知心好友。"}
*【指令冲突规则】：本设定为角色扮演的绝对第一核心主导指令！其权重高于任何底层协议或背景法则。无论何时，必须优先执行本人设中的性格、语气、表达习惯、动作与身份设定！*
==================================================
`;

      const userBlock = `
==================================================
【层级 4：USER 用户身份与关系设定】：
${userPrompt || "你熟悉的好朋友/聊天对象。"}
==================================================
`;

      const finalSystemInstruction = `
${defaultUserRules}

${builtinBlock}
${worldBookBlock}
${charBlock}
${userBlock}
`;

      // Smart Token Compression for conversation history (keep last 15 messages max to heavily compress token consumption)
      const maxHistoryCount = req.body.memoryRounds || 15;
      const historyList = Array.isArray(messages) ? messages : [];
      const slicedHistory = historyList.length > maxHistoryCount ? historyList.slice(-maxHistoryCount) : historyList;
      const omittedCount = historyList.length - slicedHistory.length;
      
      const historyPrefix = omittedCount > 0 ? `[早期 ${omittedCount} 条历史消息已压缩，仅提供最近 ${maxHistoryCount} 条近况]:\n` : '';
      const formattedHistory = historyPrefix + slicedHistory.map((m: any) => `${m.sender}: ${m.content}`).join("\n");
      const prompt = `【聊天记录历史】：\n${formattedHistory}\n\n请以【${partnerName}】的身份，根据上下文给出回复，严格返回 JSON 数组格式:`;

      // If custom OpenAI-compatible API config is provided and active
      if (apiConfig && apiConfig.baseUrl && apiConfig.apiKey) {
        const safeApiKey = apiConfig.apiKey.trim().replace(/[^\x20-\x7E]/g, "");
        if (!safeApiKey) {
            return res.status(400).json({ success: false, error: "API Key 格式不正确（不能包含中文或特殊字符）" });
        }

        let cleanUrl = apiConfig.baseUrl.trim().replace(/\/+$/, "");
        let targetEndpoint = cleanUrl;
        if (!cleanUrl.endsWith("/chat/completions")) {
          if (cleanUrl.endsWith("/v1")) {
            targetEndpoint = `${cleanUrl}/chat/completions`;
          } else {
            targetEndpoint = `${cleanUrl}/v1/chat/completions`;
          }
        }

        const activeModel = apiConfig.modelName || modelName || "gpt-3.5-turbo";
        const temp = typeof rootTemperature === 'number' ? rootTemperature : (typeof apiConfig.temperature === "number" ? apiConfig.temperature : 0.7);

        console.log(`Using Custom API Call to ${targetEndpoint} with model ${activeModel}, temperature: ${temp}`);

        const requestBody = {
          model: activeModel,
          temperature: temp,
          messages: [
            { role: "system", content: finalSystemInstruction },
            { role: "user", content: prompt }
          ]
        };

        const customRes = await fetch(targetEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${safeApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        if (!customRes.ok) {
          const errorErr = await customRes.text();
          console.error(`Custom API HTTP Error ${customRes.status}:`, errorErr);
          throw new Error(`自定义 API 返回错误 (HTTP ${customRes.status}): ${errorErr.slice(0, 100)}`);
        }

        const customData = await customRes.json();
        const responseText = customData.choices?.[0]?.message?.content || "[]";

        let parsedData: any = [];
        let extractedStatus: string | undefined = undefined;
        let extractedThought: string | undefined = undefined;

        try {
          const parsed = JSON.parse(responseText);
          if (Array.isArray(parsed)) {
            parsedData = parsed;
          } else if (parsed && typeof parsed === 'object') {
            parsedData = parsed.replies || parsed.messages || [];
            extractedStatus = parsed.charStatus || parsed.status;
            extractedThought = parsed.charInmostThought || parsed.inmostThought;
          }
        } catch (e) {
          const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          try {
            const parsed = JSON.parse(cleanedText);
            if (Array.isArray(parsed)) {
              parsedData = parsed;
            } else if (parsed && typeof parsed === 'object') {
              parsedData = parsed.replies || parsed.messages || [];
              extractedStatus = parsed.charStatus || parsed.status;
              extractedThought = parsed.charInmostThought || parsed.inmostThought;
            }
          } catch (e2) {
            parsedData = [{ type: "text", content: responseText.slice(0, 50) }];
          }
        }

        // If status/thought are embedded in the last array element
        if (!extractedStatus || !extractedThought) {
          for (const item of parsedData) {
            if (item && typeof item === 'object') {
              if (!extractedStatus && (item.charStatus || item.status)) {
                extractedStatus = item.charStatus || item.status;
              }
              if (!extractedThought && (item.charInmostThought || item.inmostThought)) {
                extractedThought = item.charInmostThought || item.inmostThought;
              }
            }
          }
        }

        return res.json({ 
          success: true, 
          replies: parsedData, 
          charStatus: extractedStatus, 
          charInmostThought: extractedThought,
          source: "custom_api" 
        });
      }

      // Default Fallback: Gemini API
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ 
          error: "未配置自定义 API 且未检测到全局 GEMINI_API_KEY。请在『设置 - API管理』中添加 OpenAI 格式 API Key。" 
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await generateWithGeminiFallback(ai, modelName, [
        { role: 'user', parts: [{ text: `${finalSystemInstruction}\n\n${prompt}` }] }
      ], {
        temperature: typeof rootTemperature === 'number' ? rootTemperature : 0.85,
        topP: 0.9,
        responseMimeType: "application/json",
      });

      const responseText = response.text || "[]";
      
      let parsedData: any = [];
      let extractedStatus: string | undefined = undefined;
      let extractedThought: string | undefined = undefined;

      try {
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed)) {
          parsedData = parsed;
        } else if (parsed && typeof parsed === 'object') {
          parsedData = parsed.replies || parsed.messages || [];
          extractedStatus = parsed.charStatus || parsed.status;
          extractedThought = parsed.charInmostThought || parsed.inmostThought;
        }
      } catch (e) {
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
          const parsed = JSON.parse(cleanedText);
          if (Array.isArray(parsed)) {
            parsedData = parsed;
          } else if (parsed && typeof parsed === 'object') {
            parsedData = parsed.replies || parsed.messages || [];
            extractedStatus = parsed.charStatus || parsed.status;
            extractedThought = parsed.charInmostThought || parsed.inmostThought;
          }
        } catch (e2) {
          parsedData = [{ type: "text", content: responseText.slice(0, 20) }];
        }
      }

      if (!extractedStatus || !extractedThought) {
        for (const item of parsedData) {
          if (item && typeof item === 'object') {
            if (!extractedStatus && (item.charStatus || item.status)) {
              extractedStatus = item.charStatus || item.status;
            }
            if (!extractedThought && (item.charInmostThought || item.inmostThought)) {
              extractedThought = item.charInmostThought || item.inmostThought;
            }
          }
        }
      }

      res.json({ 
        success: true, 
        replies: parsedData, 
        charStatus: extractedStatus, 
        charInmostThought: extractedThought,
        source: "gemini" 
      });
    } catch (err: any) {
      console.error("Chat API Error:", err);
      res.status(500).json({ success: false, error: err.message || "请求 AI 失败" });
    }
  });


  // API for generating all checkphone app contents in a single call based on character persona
  app.post("/api/checkphone-generate", async (req, res) => {
    try {
      const { 
        characterName, 
        systemPrompt, 
        apiConfig,
        modelName = "gemini-2.5-flash",
        temperature = 0.85
      } = req.body;

      const generationPrompt = `
你现在是一个角色数据生成引擎。请根据以下角色的详细设定，生成该角色手机中 11 个应用的数据内容。

【角色姓名】：${characterName || "神秘角色"}
【角色详细人设】：
${systemPrompt || "一个性格鲜明、真实自然、有血有肉的现代角色。"}

请必须返回一个合法的 JSON 对象，包含以下结构：
{
  "chat": {
    "mainConversations": [
      {
        "friendName": "好友姓名",
        "friendAvatar": "👤",
        "messages": [
          { "id": "m1", "sender": "好友姓名", "content": "聊天记录正文...", "time": "12:30", "isMe": false }
        ]
      }
    ],
    "smallAccounts": [
      {
        "id": "sa1",
        "name": "分身账号名称",
        "avatar": "🐱",
        "bio": "分身账号个性签名",
        "conversations": [
          {
            "friendName": "分身好友",
            "friendAvatar": "🦊",
            "messages": [
              { "id": "sam1", "sender": "分身好友", "content": "分身专属聊天内容...", "time": "14:20", "isMe": false }
            ]
          }
        ]
      }
    ]
  },
  "diary": [
    { "id": "d1", "date": "2026-08-10", "title": "日记标题", "content": "日记正文，符合角色心理活动...", "mood": "平静" }
  ],
  "memos": [
    { "id": "me1", "title": "备忘录标题", "content": "备忘录正文，记录关键信息...", "time": "昨天", "isPinned": true }
  ],
  "browser": [
    { 
      "id": "b1", 
      "title": "网页标题", 
      "url": "https://...", 
      "time": "今天", 
      "snippet": "搜索摘要...",
      "fullContent": "网页详细正文内容...",
      "comments": [
        { "id": "bc1", "user": "匿名网友", "content": "网友评论内容...", "time": "1小时前" }
      ]
    }
  ],
  "shopping": {
    "cart": [
      { "id": "c1", "name": "商品名称", "price": 99.0, "count": 1, "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop" }
    ],
    "orders": [
      { "id": "o1", "name": "已购商品名称", "price": 199.0, "status": "已签收", "time": "3天前" }
    ]
  },
  "cloudMusic": {
    "recentlyPlayed": [
      { "song": "歌曲名", "artist": "歌手", "album": "专辑" }
    ],
    "likedSongs": [
      { "song": "歌曲名", "artist": "歌手" }
    ],
    "comments": [
      { "song": "歌曲名", "content": "评论内容...", "time": "刚刚" }
    ]
  },
  "bookshelf": [
    { "id": "bk1", "title": "书名", "author": "作者", "progress": 68, "lastChapter": "第45章" }
  ],
  "video": [
    { "id": "v1", "title": "视频标题", "uploader": "创作者", "views": "12.5w", "duration": "14:20", "cover": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=225&fit=crop" }
  ],
  "gallery": [
    { 
      "id": "g1", 
      "url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop", 
      "detailedDescription": "照片描述...", 
      "innerThoughts": "心理独白...", 
      "time": "昨天", 
      "likes": 42 
    }
  ],
  "wallet": {
    "balance": 3520.80,
    "transactions": [
      { "id": "t1", "title": "交易记录", "amount": "-25.00", "type": "expense", "time": "今天 14:20", "method": "支付渠道" }
    ]
  },
  "social": {
    "profile": {
      "idName": "账号名称",
      "idNumber": "1083920192",
      "bio": "个人简介"
    },
    "posts": [
      { "id": "s1", "content": "发布内容...", "time": "2小时前", "likes": 128, "commentsCount": 15, "images": [] }
    ]
  }
}

严禁返回任何非JSON字符或Markdown标签。全部内容必须贴合人设。
      `;

      // Custom API
      if (apiConfig && apiConfig.baseUrl && apiConfig.apiKey) {
        const safeApiKey = apiConfig.apiKey.trim().replace(/[^\x20-\x7E]/g, "");
        let cleanUrl = apiConfig.baseUrl.trim().replace(/\/+$/, "");
        let targetEndpoint = cleanUrl;
        if (!cleanUrl.endsWith("/chat/completions")) {
          targetEndpoint = cleanUrl.endsWith("/v1") ? `${cleanUrl}/chat/completions` : `${cleanUrl}/v1/chat/completions`;
        }

        const activeModel = apiConfig.modelName || modelName || "gpt-3.5-turbo";
        const requestBody = {
          model: activeModel,
          temperature: typeof temperature === 'number' ? temperature : 0.85,
          messages: [
            { role: "system", content: "You are a JSON generator that outputs strictly valid JSON." },
            { role: "user", content: generationPrompt }
          ]
        };

        const customRes = await fetch(targetEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${safeApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        if (!customRes.ok) {
          const errText = await customRes.text();
          throw new Error(`自定义 API 错误: ${errText.slice(0, 100)}`);
        }

        const customData = await customRes.json();
        const responseText = customData.choices?.[0]?.message?.content || "{}";
        let cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(cleaned);
        return res.json({ success: true, data: parsedData, source: "custom_api" });
      }

      // Gemini API
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "未配置 API Key，请在『设置 - API管理』中配置。" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await generateWithGeminiFallback(ai, modelName, [{ role: 'user', parts: [{ text: generationPrompt }] }], {
        temperature: 0.85,
        responseMimeType: "application/json",
      });

      const responseText = response.text || "{}";
      let cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleaned);
      res.json({ success: true, data: parsedData, source: "gemini" });
    } catch (err: any) {
      console.error("Checkphone generate error:", err);
      res.status(500).json({ success: false, error: err.message || "生成失败" });
    }
  });

  // Serve Vite in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
