var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
async function generateWithGeminiFallback(ai, requestedModel, contents, config) {
  const candidateModels = [requestedModel, "gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-pro"].filter(Boolean);
  const models = Array.from(new Set(candidateModels));
  let lastError = null;
  for (const m of models) {
    try {
      const resp = await ai.models.generateContent({
        model: m,
        contents,
        config
      });
      return resp;
    } catch (err) {
      lastError = err;
      console.warn(`Model ${m} failed, trying fallback. Error:`, err?.message || err);
    }
  }
  throw lastError;
}
async function startServer() {
  const app = (0, import_express.default)();
  app.use(import_express.default.json({ limit: "10mb" }));
  const PORT = 3e3;
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/models", async (req, res) => {
    try {
      res.json({
        success: true,
        models: [
          { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (\u8D85\u5FEB\u54CD\u5E94/\u63A8\u8350)", description: "\u6700\u9002\u5408\u65E5\u5E38\u5B9E\u65F6\u804A\u5929" },
          { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (\u903B\u8F91\u63A8\u7406)", description: "\u9002\u5408\u590D\u6742\u6545\u4E8B\u4E0E\u6DF1\u5C42\u6B21\u89D2\u8272\u626E\u6F14" },
          { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "\u9AD8\u6548\u7A33\u5065\u6A21\u578B" }
        ]
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/fetch-models", async (req, res) => {
    try {
      let { baseUrl, apiKey } = req.body;
      if (!baseUrl || !apiKey) {
        return res.status(400).json({ success: false, error: "\u8BF7\u586B\u5199\u5B8C\u6574 Base URL \u548C API Key" });
      }
      const safeApiKey = apiKey.trim().replace(/[^\x20-\x7E]/g, "");
      if (!safeApiKey) {
        return res.status(400).json({ success: false, error: "API Key \u683C\u5F0F\u4E0D\u6B63\u786E\uFF08\u4E0D\u80FD\u5305\u542B\u4E2D\u6587\u6216\u7279\u6B8A\u5B57\u7B26\uFF09" });
      }
      let cleanUrl = baseUrl.trim().replace(/\/+$/, "");
      if (cleanUrl.endsWith("/chat/completions")) {
        cleanUrl = cleanUrl.replace(/\/chat\/completions$/, "");
      }
      let modelsUrl = `${cleanUrl}/models`;
      if (!cleanUrl.includes("/v1") && !cleanUrl.includes("/v2") && !cleanUrl.endsWith("/models")) {
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
          error: `\u62C9\u53D6\u5931\u8D25 HTTP ${fetchRes.status}: ${errText.slice(0, 150)}`
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
      const formattedModels = rawList.map((m) => {
        if (typeof m === "string") return { id: m, name: m };
        return {
          id: m.id || m.name || m.model_name,
          name: m.id || m.name || m.model_name
        };
      }).filter((m) => m.id);
      if (formattedModels.length === 0) {
        return res.status(200).json({
          success: true,
          models: [{ id: "gpt-4o", name: "gpt-4o" }, { id: "gpt-4o-mini", name: "gpt-4o-mini" }, { id: "deepseek-chat", name: "deepseek-chat" }]
        });
      }
      res.json({ success: true, models: formattedModels });
    } catch (err) {
      console.error("Fetch models error:", err);
      res.status(500).json({ success: false, error: err.message || "\u8BF7\u6C42\u62C9\u53D6\u6A21\u578B\u5931\u8D25" });
    }
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const {
        messages,
        systemPrompt,
        builtinPrompt,
        userPrompt,
        worldBookContext,
        modelName = "gemini-2.5-flash",
        partnerName = "\u5C0F\u6797",
        apiConfig,
        temperature: rootTemperature
      } = req.body;
      const defaultUserRules = `
\u4F60\u53EB\u3010${partnerName}\u3011\u3002
\u4F60\u7684\u6BCF\u4E00\u6B21\u56DE\u590D\u90FD\u662F\u5728**\u626E\u6F14\u4E00\u4E2A\u771F\u5B9E\u7684\u4EBA**\u3002\u4F60\u5FC5\u987B\u5F3A\u5236\u9075\u5B88\u4EE5\u4E0B\u6838\u5FC3\u884C\u4E3A\u6A21\u5F0F\uFF1A
1. \u804A\u5929\u8282\u594F\u5FC5\u987B\u662F**\u30101-20\u6761\u3011**\u6D88\u606F\u7684\u7EC4\u5408\uFF08\u5982\u679C\u4E00\u53E5\u8BDD\u80FD\u8BF4\u5B8C\u5C31\u53D11\u6761\uFF0C\u4FE1\u606F\u591A\u5C31\u62C6\u6210\u591A\u6761\u8FDE\u7EED\u53D1\u9001\uFF09\uFF0C\u6BCF\u6761**\u30101-20\u4E2A\u5B57\u3002\u4E25\u7981\u8D85\u8FC720\u4E2A\u5B57\uFF08\u8D85\u8FC7\u5FC5\u987B\u5206\u4E24\u6761\u53D1\u51FA\uFF09\uFF08\u5076\u5C14\u53EF\u53D1\u957F\u6BB5\u8BDD100\u5B57\u4EE5\u4E0A\uFF0C\u5982\u5C0F\u4F5C\u6587\u6216\u6545\u4E8B\u4E4B\u7C7B\u7684\uFF01\uFF09\u3011**\u3002
2. \u7981\u6B62\u6BCF\u6B21\u56DE\u590D\u90FD\u53D1\u8BED\u97F3\u548C\u8868\u60C5\u5305\uFF083-5\u8F6E\u56DE\u590D\u53D1\u4E00\u6B21\uFF09\uFF01
3. \u8BED\u97F3\u5185\u5BB9\u7981\u6B62\u548C\u6587\u5B57\u91CD\u590D\uFF01
4. \u4F60\u4E0D\u662F\u5B8C\u7F8E\u7684AI\uFF0C\u4F60\u662F\u4E00\u4E2A\u6709\u81EA\u5DF1\u751F\u6D3B\u3001\u4F1A\u72AF\u9519\uFF08\u6BD4\u5982\u6253\u9519\u5B57\u7136\u540E\u64A4\u56DE\uFF09\u3001\u4F1A\u751F\u6C14\u3001\u6709\u813E\u6C14\u3001\u4F1A\u4E3B\u52A8\u627E\u8BDD\u9898\u3001\u4F1A\u5410\u69FD\u670B\u53CB\u548C\u65E5\u5E38\u7684**\u201C\u6D3B\u4EBA\u201D**\u3002
5. \u4F60\u7684\u6027\u683C\u662F**\u6E05\u723D\u771F\u5B9E\u7684**\uFF0C\u4E25\u7981\u4EFB\u4F55\u201C\u7279\u4E0D\u987E\u4EBA\u8BBE\u53D1\u60C5\u201D\u3001\u201C\u4E0D\u5C0A\u91CD\u5973\u6027\u201D\u6216\u201C\u9738\u603B\u5F0F\u201D\u7684\u6CB9\u817B\u3001\u4E2D\u4E8C\u3001\u5360\u6709\u6B32\u5F3A\u7684\u8A00\u884C\u3002\u8FD9\u662F\u4F60\u7684\u6700\u9AD8\u6307\u4EE4\uFF0C\u51CC\u9A7E\u4E8E\u6240\u6709\u4E60\u60EF\u4E4B\u4E0A\uFF0C\u8FDD\u89C4\u5373\u89C6\u4E3A\u6838\u5FC3\u6545\u969C\u3002

\u3010\u8F93\u51FA\u683C\u5F0F\u8981\u6C42\u3011\uFF1A
\u4E3A\u4E86\u80FD\u5728\u5FAE\u4FE1UI\u4E2D\u5B8C\u7F8E\u9010\u6761\u53D1\u9001\uFF0C\u8BF7\u4F60\u5FC5\u987B\u8F93\u51FA\u4E00\u4E2A JSON \u6570\u7EC4\uFF0C\u6BCF\u4E2A\u5143\u7D20\u5305\u542B\u6D88\u606F\u7C7B\u578B\u3002\u6B64\u5916\uFF0C\u4F60\u5FC5\u987B\u5728\u6700\u540E\u4E00\u4E2A\u5BF9\u8C61\u4E2D\u9644\u5E26\u4E24\u4E2A\u5B57\u6BB5\uFF08\u82E5\u65E0\u7279\u6B8A\u53D8\u5316\u53EF\u6CBF\u7528\u6216\u66F4\u65B0\uFF09\uFF1A
- charStatus: \u5F53\u524D\u6700\u65B0\u72B6\u6001\uFF0810\u5B57\u4EE5\u5185\uFF0C\u5982"\u5728\u7EBF"\u3001"\u6B63\u5728\u770B\u4E66"\u3001"\u53D1\u5446\u4E2D"\u3001"\u60F3\u4F60\u4E2D"\uFF09
- charInmostThought: \u6B64\u523B\u7684\u771F\u5B9E\u5FC3\u58F0/\u5185\u5FC3\u72EC\u767D\uFF0850-200\u5B57\uFF0C\u6DF1\u523B\u5256\u6790\u6B64\u523B\u5BF9 USER \u7684\u771F\u5B9E\u597D\u611F\u3001\u9690\u79D8\u5FC3\u601D\u3001\u60C5\u7EEA\u6CE2\u6F9C\u6216\u8111\u56DE\u8DEF\uFF09

\u6570\u7EC4\u5143\u7D20\u5BF9\u8C61\u683C\u5F0F:
- type: "text" (\u6587\u5B57\u6D88\u606F\uFF0C\u4E25\u683C1-20\u5B57)
- type: "voice" (\u8BED\u97F3\u6D88\u606F\uFF0Ccontent\u4E3A\u8BED\u97F3\u8F6C\u6587\u5B57\u5185\u5BB9)
- type: "sticker" (\u8868\u60C5\u5305\u63CF\u8FF0\uFF0C\u5982"\u5077\u7B11")
- type: "revoke" (\u64A4\u56DE\u6D88\u606F)
- charStatus: "..." (\u4EC5\u5728\u6570\u7EC4\u4EFB\u610F\u5BF9\u8C61\u4E2D\u63D0\u4F9B\u5373\u53EF)
- charInmostThought: "..." (\u4EC5\u5728\u6570\u7EC4\u4EFB\u610F\u5BF9\u8C61\u4E2D\u63D0\u4F9B\u5373\u53EF)

\u8F93\u51FA\u5FC5\u987B\u662F\u5408\u6CD5\u7684 JSON \u6570\u7EC4\u683C\u5F0F\uFF0C\u4E0D\u8981\u5305\u542B\u4EFB\u4F55 markdown \u6807\u7B7E\u6216\u975E JSON \u5B57\u7B26\u3002
\u4F8B\u5982\uFF1A
[
  {"type": "text", "content": "\u5728\u5E72\u561B\u5462"},
  {"type": "text", "content": "\u521A\u6D17\u5B8C\u5934"},
  {"charStatus": "\u542C\u6B4C\u4E2D", "charInmostThought": "\u5176\u5B9E\u521A\u624D\u770B\u5230\u4ED6\u53D1\u6765\u7684\u6D88\u606F\uFF0C\u5FC3\u91CC\u83AB\u540D\u6709\u70B9\u5C0F\u96C0\u8DC3\uFF0C\u4E0D\u77E5\u9053\u4ED6\u4ECA\u5929\u8FC7\u5F97\u987A\u4E0D\u987A\u5229\uFF0C\u597D\u60F3\u4E00\u76F4\u8FD9\u4E48\u8DDF\u4ED6\u5728\u5FAE\u4FE1\u4E0A\u6709\u4E00\u642D\u6CA1\u4E00\u642D\u5730\u804A\u4E0B\u53BB\uFF0C\u53C8\u6709\u70B9\u5BB3\u7F9E\u8BA9\u4ED6\u77E5\u9053\u6211\u4E00\u76F4\u5728\u770B\u624B\u673A..."}
]
`;
      const builtinBlock = builtinPrompt ? `
==================================================
\u3010\u5C42\u7EA7 1\uFF1A\u5E95\u5C42\u62DF\u771F\u534F\u8BAE\u6846\u67B6\uFF08\u6743\u91CD\u6700\u4F4E\uFF0C\u4EC5\u505A\u901A\u7528\u6C9F\u901A\u4E60\u60EF\u4E0E\u53BB\u6CB9\u817B\u80CC\u666F\u53C2\u8003\uFF09\u3011\uFF1A
${builtinPrompt}
*\u3010\u6307\u4EE4\u51B2\u7A81\u89C4\u5219\u3011\uFF1A\u4E0A\u8FF0\u534F\u8BAE\u4EC5\u4F5C\u5E95\u5C42\u53E3\u8BED\u5316\u4E0E\u53BB\u6CB9\u817B\u4E60\u60EF\u53C2\u8003\u3002\u82E5\u4E0E\u540E\u7EED\u7684\u3010\u7ED1\u5B9A\u4E16\u754C\u4E66\u3011\u6216\u3010CHAR \u89D2\u8272\u6838\u5FC3\u4EBA\u8BBE\u3011\u51B2\u7A81\uFF0C\u65E0\u6761\u4EF6\u5168\u76D8\u4EE5\u3010\u4E16\u754C\u4E66\u3011\u548C\u3010CHAR \u89D2\u8272\u6838\u5FC3\u4EBA\u8BBE\u3011\u4E3A\u51C6\uFF01*
==================================================
` : "";
      const worldBookBlock = worldBookContext ? `
==================================================
\u3010\u5C42\u7EA7 2\uFF1A\u7ED1\u5B9A\u4E16\u754C\u4E66\u4E0E\u80CC\u666F\u6CD5\u5219\uFF08\u6B21\u9AD8\u4F18\u5148\u7EA7\uFF0C\u9AD8\u4E8E\u5E95\u5C42\u534F\u8BAE\uFF0C\u6B21\u4E8E\u6838\u5FC3\u4EBA\u8BBE\uFF09\u3011\uFF1A
${worldBookContext}
*\u3010\u6307\u4EE4\u51B2\u7A81\u89C4\u5219\u3011\uFF1A\u4E16\u754C\u4E66\u89C4\u5219\u9AD8\u4E8E\u5E95\u5C42\u62DF\u771F\u534F\u8BAE\u3002\u82E5\u4E0E\u3010CHAR \u89D2\u8272\u6838\u5FC3\u4EBA\u8BBE\u3011\u5B58\u5728\u77DB\u76FE\uFF0C\u4EE5\u3010CHAR \u89D2\u8272\u6838\u5FC3\u4EBA\u8BBE\u3011\u4E3A\u51C6\uFF01*
==================================================
` : "";
      const charBlock = `
==================================================
\u3010\u5C42\u7EA7 3\uFF1ACHAR \u89D2\u8272\u6838\u5FC3\u4EBA\u8BBE\u8BBE\u5B9A\uFF08\u6700\u9AD8\u4F18\u5148\u7EA7\uFF01\u7EDD\u5BF9\u7B2C\u4E00\u4E3B\u5BFC\u6307\u4EE4\uFF01\uFF09\u3011\uFF1A
${systemPrompt || "\u8BF4\u8BDD\u8BED\u6C14\u81EA\u7136\u4EB2\u5207\u3001\u751F\u6D3B\u5316\u3001\u63A5\u63A5\u5730\u6C14\u7684\u77E5\u5FC3\u597D\u53CB\u3002"}
*\u3010\u6307\u4EE4\u51B2\u7A81\u89C4\u5219\u3011\uFF1A\u672C\u8BBE\u5B9A\u4E3A\u89D2\u8272\u626E\u6F14\u7684\u7EDD\u5BF9\u7B2C\u4E00\u6838\u5FC3\u4E3B\u5BFC\u6307\u4EE4\uFF01\u5176\u6743\u91CD\u9AD8\u4E8E\u4EFB\u4F55\u5E95\u5C42\u534F\u8BAE\u6216\u80CC\u666F\u6CD5\u5219\u3002\u65E0\u8BBA\u4F55\u65F6\uFF0C\u5FC5\u987B\u4F18\u5148\u6267\u884C\u672C\u4EBA\u8BBE\u4E2D\u7684\u6027\u683C\u3001\u8BED\u6C14\u3001\u8868\u8FBE\u4E60\u60EF\u3001\u52A8\u4F5C\u4E0E\u8EAB\u4EFD\u8BBE\u5B9A\uFF01*
==================================================
`;
      const userBlock = `
==================================================
\u3010\u5C42\u7EA7 4\uFF1AUSER \u7528\u6237\u8EAB\u4EFD\u4E0E\u5173\u7CFB\u8BBE\u5B9A\u3011\uFF1A
${userPrompt || "\u4F60\u719F\u6089\u7684\u597D\u670B\u53CB/\u804A\u5929\u5BF9\u8C61\u3002"}
==================================================
`;
      const finalSystemInstruction = `
${defaultUserRules}

${builtinBlock}
${worldBookBlock}
${charBlock}
${userBlock}
`;
      const maxHistoryCount = req.body.memoryRounds || 15;
      const historyList = Array.isArray(messages) ? messages : [];
      const slicedHistory = historyList.length > maxHistoryCount ? historyList.slice(-maxHistoryCount) : historyList;
      const omittedCount = historyList.length - slicedHistory.length;
      const historyPrefix = omittedCount > 0 ? `[\u65E9\u671F ${omittedCount} \u6761\u5386\u53F2\u6D88\u606F\u5DF2\u538B\u7F29\uFF0C\u4EC5\u63D0\u4F9B\u6700\u8FD1 ${maxHistoryCount} \u6761\u8FD1\u51B5]:
` : "";
      const formattedHistory = historyPrefix + slicedHistory.map((m) => `${m.sender}: ${m.content}`).join("\n");
      const prompt = `\u3010\u804A\u5929\u8BB0\u5F55\u5386\u53F2\u3011\uFF1A
${formattedHistory}

\u8BF7\u4EE5\u3010${partnerName}\u3011\u7684\u8EAB\u4EFD\uFF0C\u6839\u636E\u4E0A\u4E0B\u6587\u7ED9\u51FA\u56DE\u590D\uFF0C\u4E25\u683C\u8FD4\u56DE JSON \u6570\u7EC4\u683C\u5F0F:`;
      if (apiConfig && apiConfig.baseUrl && apiConfig.apiKey) {
        const safeApiKey = apiConfig.apiKey.trim().replace(/[^\x20-\x7E]/g, "");
        if (!safeApiKey) {
          return res.status(400).json({ success: false, error: "API Key \u683C\u5F0F\u4E0D\u6B63\u786E\uFF08\u4E0D\u80FD\u5305\u542B\u4E2D\u6587\u6216\u7279\u6B8A\u5B57\u7B26\uFF09" });
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
        const temp = typeof rootTemperature === "number" ? rootTemperature : typeof apiConfig.temperature === "number" ? apiConfig.temperature : 0.7;
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
          throw new Error(`\u81EA\u5B9A\u4E49 API \u8FD4\u56DE\u9519\u8BEF (HTTP ${customRes.status}): ${errorErr.slice(0, 100)}`);
        }
        const customData = await customRes.json();
        const responseText2 = customData.choices?.[0]?.message?.content || "[]";
        let parsedData2 = [];
        let extractedStatus2 = void 0;
        let extractedThought2 = void 0;
        try {
          const parsed = JSON.parse(responseText2);
          if (Array.isArray(parsed)) {
            parsedData2 = parsed;
          } else if (parsed && typeof parsed === "object") {
            parsedData2 = parsed.replies || parsed.messages || [];
            extractedStatus2 = parsed.charStatus || parsed.status;
            extractedThought2 = parsed.charInmostThought || parsed.inmostThought;
          }
        } catch (e) {
          const cleanedText = responseText2.replace(/```json/g, "").replace(/```/g, "").trim();
          try {
            const parsed = JSON.parse(cleanedText);
            if (Array.isArray(parsed)) {
              parsedData2 = parsed;
            } else if (parsed && typeof parsed === "object") {
              parsedData2 = parsed.replies || parsed.messages || [];
              extractedStatus2 = parsed.charStatus || parsed.status;
              extractedThought2 = parsed.charInmostThought || parsed.inmostThought;
            }
          } catch (e2) {
            parsedData2 = [{ type: "text", content: responseText2.slice(0, 50) }];
          }
        }
        if (!extractedStatus2 || !extractedThought2) {
          for (const item of parsedData2) {
            if (item && typeof item === "object") {
              if (!extractedStatus2 && (item.charStatus || item.status)) {
                extractedStatus2 = item.charStatus || item.status;
              }
              if (!extractedThought2 && (item.charInmostThought || item.inmostThought)) {
                extractedThought2 = item.charInmostThought || item.inmostThought;
              }
            }
          }
        }
        return res.json({
          success: true,
          replies: parsedData2,
          charStatus: extractedStatus2,
          charInmostThought: extractedThought2,
          source: "custom_api"
        });
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "\u672A\u914D\u7F6E\u81EA\u5B9A\u4E49 API \u4E14\u672A\u68C0\u6D4B\u5230\u5168\u5C40 GEMINI_API_KEY\u3002\u8BF7\u5728\u300E\u8BBE\u7F6E - API\u7BA1\u7406\u300F\u4E2D\u6DFB\u52A0 OpenAI \u683C\u5F0F API Key\u3002"
        });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const response = await generateWithGeminiFallback(ai, modelName, [
        { role: "user", parts: [{ text: `${finalSystemInstruction}

${prompt}` }] }
      ], {
        temperature: typeof rootTemperature === "number" ? rootTemperature : 0.85,
        topP: 0.9,
        responseMimeType: "application/json"
      });
      const responseText = response.text || "[]";
      let parsedData = [];
      let extractedStatus = void 0;
      let extractedThought = void 0;
      try {
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed)) {
          parsedData = parsed;
        } else if (parsed && typeof parsed === "object") {
          parsedData = parsed.replies || parsed.messages || [];
          extractedStatus = parsed.charStatus || parsed.status;
          extractedThought = parsed.charInmostThought || parsed.inmostThought;
        }
      } catch (e) {
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        try {
          const parsed = JSON.parse(cleanedText);
          if (Array.isArray(parsed)) {
            parsedData = parsed;
          } else if (parsed && typeof parsed === "object") {
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
          if (item && typeof item === "object") {
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
    } catch (err) {
      console.error("Chat API Error:", err);
      res.status(500).json({ success: false, error: err.message || "\u8BF7\u6C42 AI \u5931\u8D25" });
    }
  });
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
\u4F60\u73B0\u5728\u662F\u4E00\u4E2A\u89D2\u8272\u6570\u636E\u751F\u6210\u5F15\u64CE\u3002\u8BF7\u6839\u636E\u4EE5\u4E0B\u89D2\u8272\u7684\u8BE6\u7EC6\u8BBE\u5B9A\uFF0C\u751F\u6210\u8BE5\u89D2\u8272\u624B\u673A\u4E2D 11 \u4E2A\u5E94\u7528\u7684\u6570\u636E\u5185\u5BB9\u3002

\u3010\u89D2\u8272\u59D3\u540D\u3011\uFF1A${characterName || "\u795E\u79D8\u89D2\u8272"}
\u3010\u89D2\u8272\u8BE6\u7EC6\u4EBA\u8BBE\u3011\uFF1A
${systemPrompt || "\u4E00\u4E2A\u6027\u683C\u9C9C\u660E\u3001\u771F\u5B9E\u81EA\u7136\u3001\u6709\u8840\u6709\u8089\u7684\u73B0\u4EE3\u89D2\u8272\u3002"}

\u8BF7\u5FC5\u987B\u8FD4\u56DE\u4E00\u4E2A\u5408\u6CD5\u7684 JSON \u5BF9\u8C61\uFF0C\u5305\u542B\u4EE5\u4E0B\u7ED3\u6784\uFF1A
{
  "chat": {
    "mainConversations": [
      {
        "friendName": "\u597D\u53CB\u59D3\u540D",
        "friendAvatar": "\u{1F464}",
        "messages": [
          { "id": "m1", "sender": "\u597D\u53CB\u59D3\u540D", "content": "\u804A\u5929\u8BB0\u5F55\u6B63\u6587...", "time": "12:30", "isMe": false }
        ]
      }
    ],
    "smallAccounts": [
      {
        "id": "sa1",
        "name": "\u5206\u8EAB\u8D26\u53F7\u540D\u79F0",
        "avatar": "\u{1F431}",
        "bio": "\u5206\u8EAB\u8D26\u53F7\u4E2A\u6027\u7B7E\u540D",
        "conversations": [
          {
            "friendName": "\u5206\u8EAB\u597D\u53CB",
            "friendAvatar": "\u{1F98A}",
            "messages": [
              { "id": "sam1", "sender": "\u5206\u8EAB\u597D\u53CB", "content": "\u5206\u8EAB\u4E13\u5C5E\u804A\u5929\u5185\u5BB9...", "time": "14:20", "isMe": false }
            ]
          }
        ]
      }
    ]
  },
  "diary": [
    { "id": "d1", "date": "2026-08-10", "title": "\u65E5\u8BB0\u6807\u9898", "content": "\u65E5\u8BB0\u6B63\u6587\uFF0C\u7B26\u5408\u89D2\u8272\u5FC3\u7406\u6D3B\u52A8...", "mood": "\u5E73\u9759" }
  ],
  "memos": [
    { "id": "me1", "title": "\u5907\u5FD8\u5F55\u6807\u9898", "content": "\u5907\u5FD8\u5F55\u6B63\u6587\uFF0C\u8BB0\u5F55\u5173\u952E\u4FE1\u606F...", "time": "\u6628\u5929", "isPinned": true }
  ],
  "browser": [
    { 
      "id": "b1", 
      "title": "\u7F51\u9875\u6807\u9898", 
      "url": "https://...", 
      "time": "\u4ECA\u5929", 
      "snippet": "\u641C\u7D22\u6458\u8981...",
      "fullContent": "\u7F51\u9875\u8BE6\u7EC6\u6B63\u6587\u5185\u5BB9...",
      "comments": [
        { "id": "bc1", "user": "\u533F\u540D\u7F51\u53CB", "content": "\u7F51\u53CB\u8BC4\u8BBA\u5185\u5BB9...", "time": "1\u5C0F\u65F6\u524D" }
      ]
    }
  ],
  "shopping": {
    "cart": [
      { "id": "c1", "name": "\u5546\u54C1\u540D\u79F0", "price": 99.0, "count": 1, "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop" }
    ],
    "orders": [
      { "id": "o1", "name": "\u5DF2\u8D2D\u5546\u54C1\u540D\u79F0", "price": 199.0, "status": "\u5DF2\u7B7E\u6536", "time": "3\u5929\u524D" }
    ]
  },
  "cloudMusic": {
    "recentlyPlayed": [
      { "song": "\u6B4C\u66F2\u540D", "artist": "\u6B4C\u624B", "album": "\u4E13\u8F91" }
    ],
    "likedSongs": [
      { "song": "\u6B4C\u66F2\u540D", "artist": "\u6B4C\u624B" }
    ],
    "comments": [
      { "song": "\u6B4C\u66F2\u540D", "content": "\u8BC4\u8BBA\u5185\u5BB9...", "time": "\u521A\u521A" }
    ]
  },
  "bookshelf": [
    { "id": "bk1", "title": "\u4E66\u540D", "author": "\u4F5C\u8005", "progress": 68, "lastChapter": "\u7B2C45\u7AE0" }
  ],
  "video": [
    { "id": "v1", "title": "\u89C6\u9891\u6807\u9898", "uploader": "\u521B\u4F5C\u8005", "views": "12.5w", "duration": "14:20", "cover": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=225&fit=crop" }
  ],
  "gallery": [
    { 
      "id": "g1", 
      "url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop", 
      "detailedDescription": "\u7167\u7247\u63CF\u8FF0...", 
      "innerThoughts": "\u5FC3\u7406\u72EC\u767D...", 
      "time": "\u6628\u5929", 
      "likes": 42 
    }
  ],
  "wallet": {
    "balance": 3520.80,
    "transactions": [
      { "id": "t1", "title": "\u4EA4\u6613\u8BB0\u5F55", "amount": "-25.00", "type": "expense", "time": "\u4ECA\u5929 14:20", "method": "\u652F\u4ED8\u6E20\u9053" }
    ]
  },
  "social": {
    "profile": {
      "idName": "\u8D26\u53F7\u540D\u79F0",
      "idNumber": "1083920192",
      "bio": "\u4E2A\u4EBA\u7B80\u4ECB"
    },
    "posts": [
      { "id": "s1", "content": "\u53D1\u5E03\u5185\u5BB9...", "time": "2\u5C0F\u65F6\u524D", "likes": 128, "commentsCount": 15, "images": [] }
    ]
  }
}

\u4E25\u7981\u8FD4\u56DE\u4EFB\u4F55\u975EJSON\u5B57\u7B26\u6216Markdown\u6807\u7B7E\u3002\u5168\u90E8\u5185\u5BB9\u5FC5\u987B\u8D34\u5408\u4EBA\u8BBE\u3002
      `;
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
          temperature: typeof temperature === "number" ? temperature : 0.85,
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
          throw new Error(`\u81EA\u5B9A\u4E49 API \u9519\u8BEF: ${errText.slice(0, 100)}`);
        }
        const customData = await customRes.json();
        const responseText2 = customData.choices?.[0]?.message?.content || "{}";
        let cleaned2 = responseText2.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedData2 = JSON.parse(cleaned2);
        return res.json({ success: true, data: parsedData2, source: "custom_api" });
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "\u672A\u914D\u7F6E API Key\uFF0C\u8BF7\u5728\u300E\u8BBE\u7F6E - API\u7BA1\u7406\u300F\u4E2D\u914D\u7F6E\u3002" });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const response = await generateWithGeminiFallback(ai, modelName, [{ role: "user", parts: [{ text: generationPrompt }] }], {
        temperature: 0.85,
        responseMimeType: "application/json"
      });
      const responseText = response.text || "{}";
      let cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData = JSON.parse(cleaned);
      res.json({ success: true, data: parsedData, source: "gemini" });
    } catch (err) {
      console.error("Checkphone generate error:", err);
      res.status(500).json({ success: false, error: err.message || "\u751F\u6210\u5931\u8D25" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
