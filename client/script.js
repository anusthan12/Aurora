import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const textarea = form.querySelector('textarea');

let loadInterval = null;

// Multi-turn conversation memory
const chatHistory = [
  { role: "system", content: "You are Aurora, a helpful and concise AI assistant." }
];

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

// Form Submission Handler
const handleSubmit = async (e) => {
  if (e) e.preventDefault();

  const formData = new FormData(form);
  const userPrompt = formData.get('prompt')?.trim();

  if (!userPrompt) return;

  // Render user prompt
  chatContainer.innerHTML += chatStripe(false, userPrompt);
  form.reset();

  // Render bot placeholder stripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, ' ', uniqueId);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);
  loader(messageDiv);

  try {
    chatHistory.push({ role: 'user', content: userPrompt });

    // Requesting API inference
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'API Error');

    clearInterval(loadInterval);
    const botReply = data.reply;
    
    chatHistory.push({ role: 'assistant', content: botReply });
    typeText(messageDiv, botReply);

  } catch (error) {
    clearInterval(loadInterval);
    messageDiv.innerText = `Error: ${error.message || 'Generation failed'}`;
    messageDiv.style.color = '#f87171';
  }
};

// Input Listeners
form.addEventListener('submit', handleSubmit);
textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});
