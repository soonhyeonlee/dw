const http = require('http');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || envFile.match(/OPENAI_API_KEY=(.*)/)?.[1] || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || envFile.match(/GEMINI_API_KEY=(.*)/)?.[1] || '';

const HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LLM 채팅 테스트</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a1a2e; color: #eee; height: 100vh; display: flex; flex-direction: column; }
  .header { padding: 16px 24px; background: #16213e; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #0f3460; flex-wrap: wrap; }
  .header h1 { font-size: 18px; color: #FF6B35; }
  .selectors { display: flex; gap: 10px; align-items: center; }
  select { padding: 8px 12px; border-radius: 8px; border: 1px solid #0f3460; background: #1a1a2e; color: #eee; font-size: 14px; cursor: pointer; }
  select:focus { outline: none; border-color: #FF6B35; }
  .label { font-size: 12px; color: #888; }
  .provider-gpt { border-color: #74aa9c; }
  .provider-gpt option { color: #eee; }
  .provider-gemini { border-color: #4285f4; }
  .badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-gpt { background: #74aa9c33; color: #74aa9c; }
  .badge-gemini { background: #4285f433; color: #4285f4; }
  .chat { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  .msg { max-width: 75%; padding: 12px 16px; border-radius: 16px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
  .msg.user { align-self: flex-end; background: #FF6B35; color: #fff; border-bottom-right-radius: 4px; }
  .msg.assistant { align-self: flex-start; background: #16213e; border: 1px solid #0f3460; border-bottom-left-radius: 4px; }
  .msg.assistant .model-tag { font-size: 10px; color: #888; margin-bottom: 4px; }
  .msg.error { align-self: center; background: #e74c3c33; border: 1px solid #e74c3c; color: #e74c3c; font-size: 13px; }
  .input-area { padding: 16px 24px; background: #16213e; border-top: 1px solid #0f3460; display: flex; gap: 12px; }
  textarea { flex: 1; padding: 12px 16px; border-radius: 12px; border: 1px solid #0f3460; background: #1a1a2e; color: #eee; font-size: 14px; resize: none; height: 48px; font-family: inherit; }
  textarea:focus { outline: none; border-color: #FF6B35; }
  button { padding: 12px 24px; border-radius: 12px; border: none; background: #FF6B35; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
  button:hover { background: #e55a2b; }
  button:disabled { background: #555; cursor: not-allowed; }
  .typing { align-self: flex-start; color: #888; font-size: 13px; }
  .typing::after { content: '...'; animation: dots 1.5s infinite; }
  @keyframes dots { 0%{content:'.'} 33%{content:'..'} 66%{content:'...'} }
</style>
</head>
<body>
  <div class="header">
    <h1>DoubleWin LLM 채팅</h1>
    <div class="selectors">
      <div>
        <div class="label">대분류</div>
        <select id="provider" onchange="onProviderChange()">
          <option value="gpt">GPT (OpenAI)</option>
          <option value="gemini">Gemini (Google)</option>
        </select>
      </div>
      <div>
        <div class="label">모델</div>
        <select id="model"></select>
      </div>
      <span id="badge" class="badge badge-gpt">GPT</span>
    </div>
  </div>
  <div class="chat" id="chat"></div>
  <div class="input-area">
    <textarea id="input" placeholder="메시지를 입력하세요..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();send()}"></textarea>
    <button id="btn" onclick="send()">전송</button>
  </div>
<script>
  const models = {
    gpt: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    ],
    gemini: [
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ]
  };

  const providerEl = document.getElementById('provider');
  const modelEl = document.getElementById('model');
  const badgeEl = document.getElementById('badge');
  const chat = document.getElementById('chat');
  const input = document.getElementById('input');
  const btn = document.getElementById('btn');
  const messages = [];

  function onProviderChange() {
    const p = providerEl.value;
    modelEl.innerHTML = models[p].map(m => '<option value="'+m.value+'">'+m.label+'</option>').join('');
    badgeEl.className = 'badge badge-' + p;
    badgeEl.textContent = p === 'gpt' ? 'GPT' : 'Gemini';
  }
  onProviderChange();

  function addMsg(role, text, modelName) {
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    if (role === 'assistant' && modelName) {
      div.innerHTML = '<div class="model-tag">' + modelName + '</div>' + escapeHtml(text);
    } else {
      div.textContent = text;
    }
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
  }

  function escapeHtml(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\n/g,'<br>');
  }

  async function send() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMsg('user', text);
    messages.push({ role: 'user', content: text });

    const provider = providerEl.value;
    const model = modelEl.value;
    const modelLabel = modelEl.options[modelEl.selectedIndex].text;

    btn.disabled = true;
    const typing = document.createElement('div');
    typing.className = 'typing';
    typing.textContent = modelLabel + ' 응답 생성 중';
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, messages })
      });
      const data = await res.json();
      typing.remove();
      if (data.error) {
        addMsg('error', data.error);
      } else {
        addMsg('assistant', data.content, modelLabel);
        messages.push({ role: 'assistant', content: data.content });
      }
    } catch (e) {
      typing.remove();
      addMsg('error', '요청 실패: ' + e.message);
    }
    btn.disabled = false;
    input.focus();
  }
  input.focus();
</script>
</body>
</html>`;

async function callOpenAI(model, messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + OPENAI_API_KEY,
    },
    body: JSON.stringify({ model, messages, max_tokens: 2048 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

async function callGemini(model, messages) {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + GEMINI_API_KEY;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 2048 } }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
    return;
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const { provider, model, messages } = JSON.parse(body);

    try {
      let content;
      if (provider === 'gemini') {
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY가 .env에 설정되지 않았습니다.');
        content = await callGemini(model, messages);
      } else {
        if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY가 .env에 설정되지 않았습니다.');
        content = await callOpenAI(model, messages);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(3333, () => {
  console.log('\\n  LLM 채팅 테스트 서버 실행 중');
  console.log('  → http://localhost:3333');
  console.log('  OpenAI: ' + (OPENAI_API_KEY ? 'OK' : 'missing'));
  console.log('  Gemini: ' + (GEMINI_API_KEY ? 'OK' : 'missing') + '\\n');
});
