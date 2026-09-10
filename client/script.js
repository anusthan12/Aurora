import bot from './assets/bot.svg';
import user from './assets/user.svg';
import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const textarea = form.querySelector('textarea');

const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
let engine = null;
let isLoaded = false;
let loadInterval = null;

// Multi-turn conversation memory
const chatHistory = [
  { role: "system", content: "You are Aurora, a helpful and concise AI assistant." }
];

// 1. Status banner placed outside chat feed to prevent DOM overwrites
const statusBanner = document.createElement('div');
statusBanner.id = 'status_banner';
statusBanner.style.cssText = `
  width: 100%;
  padding: 10px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border-bottom: 1px solid rgba(56, 189, 248, 0.25);
  position: sticky;
  top: 0;
  z-index: 100;
`;
document.querySelector('#app').prepend(statusBanner);

// 2. Initialize WebLLM with progress tracking
async function initWebLLM() {
  console.log('[Aurora] Initializing WebLLM with model:', SELECTED_MODEL);
  try {
    engine = await CreateMLCEngine(SELECTED_MODEL, {
      initProgressCallback: (progress) => {
        console.log('[Aurora Progress]', progress.text);
        statusBanner.innerText = `⏳ ${progress.text}`;
      }
    });
    isLoaded = true;
    console.log('[Aurora] Engine successfully loaded and ready.');
    statusBanner.innerText = '✨ Model ready! Ask anything.';
    statusBanner.style.color = '#4ade80';
    statusBanner.style.background = 'rgba(74, 222, 128, 0.12)';
    statusBanner.style.borderBottom = '1px solid rgba(74, 222, 128, 0.25)';
    setTimeout(() => {
      statusBanner.style.display = 'none';
    }, 3500);
  } catch (err) {
    console.error('[Aurora Init Error]', err);
    statusBanner.innerText = `❌ Error: ${err.message}. Ensure your browser supports WebGPU.`;
    statusBanner.style.color = '#f87171';
    statusBanner.style.background = 'rgba(248, 113, 113, 0.15)';
  }
}
initWebLLM();

// Helper: Loading dots indicator
function loader(element) {
  element.textContent = '';
  loadInterval = setInterval(() => {
    element.textContent += '.';
    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300);
}

// Helper: Smooth typing effect
function typeText(element, text) {
  let index = 0;
  element.innerHTML = '';
  const interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
      chatContainer.scrollTop = chatContainer.scrollHeight;
    } else {
      clearInterval(interval);
    }
  }, 15);
}

// Helper: Generate unique ID for bot message elements
function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random().toString(16).slice(2);
  return `msg-${timestamp}-${randomNumber}`;
}

// Helper: Build message bubbles
function chatStripe(isAi, value, uniqueId = '') {
  return `
    <div class="wrapper ${isAi ? 'ai' : ''}">
      <div class="chat">
        <div class="profile">
          <img src="${isAi ? bot : user}" alt="${isAi ? 'bot' : 'user'}" />
        </div>
        <div class="message" ${uniqueId ? `id="${uniqueId}"` : ''}>${value}</div>
      </div>
    </div>
  `;
}

// 3. Form Submission Handler
const handleSubmit = async (e) => {
  if (e) e.preventDefault();

  if (!isLoaded) {
    console.warn('[Aurora] Model still loading. Request ignored.');
    alert("Please wait for the AI model to finish downloading.");
    return;
  }

  const formData = new FormData(form);
  const userPrompt = formData.get('prompt')?.trim();

  if (!userPrompt) {
    console.warn('[Aurora] Empty prompt ignored.');
    return;
  }

  console.log('[Aurora] User Prompt:', userPrompt);

  // Render user prompt
  chatContainer.innerHTML += chatStripe(false, userPrompt);
  form.reset();

  // Render bot placeholder stripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, ' ', uniqueId);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);
  console.log('[Aurora] Created message element:', messageDiv);

  if (!messageDiv) {
    console.error('[Aurora Error] Target message element not found:', uniqueId);
    return;
  }

  loader(messageDiv);

  try {
    chatHistory.push({ role: 'user', content: userPrompt });

    console.log('[Aurora] Requesting browser WebGPU inference...');
    const response = await engine.chat.completions.create({
      messages: chatHistory,
      temperature: 0.7,
    });

    console.log('[Aurora] Generation complete:', response);
    clearInterval(loadInterval);

    const botReply = response.choices[0]?.message?.content || 'No response generated.';
    chatHistory.push({ role: 'assistant', content: botReply });

    typeText(messageDiv, botReply);
  } catch (error) {
    console.error('[Aurora Inference Error]', error);
    clearInterval(loadInterval);
    messageDiv.innerText = `Error: ${error.message || 'Generation failed'}`;
    messageDiv.style.color = '#f87171';
  }
};

// 4. Input Listeners (Single-dispatch submit, supports Enter without Shift)
form.addEventListener('submit', handleSubmit);
textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});
