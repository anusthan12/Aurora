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

function loader(element) {
  element.textContent = '';
  loadInterval = setInterval(() => {
    element.textContent += '.';
    if (element.textContent === '....') element.textContent = '';
  }, 300);
}

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

function generateUniqueId() {
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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

const handleSubmit = async (e) => {
  if (e) e.preventDefault();

  const formData = new FormData(form);
  const userPrompt = formData.get('prompt')?.trim();

  if (!userPrompt) return;

  chatContainer.innerHTML += chatStripe(false, userPrompt);
  form.reset();

  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, ' ', uniqueId);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);
  loader(messageDiv);

  try {
    chatHistory.push({ role: 'user', content: userPrompt });

    // Directly calling the free, no-key open API
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatHistory,
        model: 'openai' // Routes to a generic open-weights model
      })
    });
    
    if (!response.ok) throw new Error('Network response was not ok');

    // Pollinations returns plain text, not JSON
    const botReply = await response.text(); 
    
    clearInterval(loadInterval);
    chatHistory.push({ role: 'assistant', content: botReply });
    typeText(messageDiv, botReply);

  } catch (error) {
    clearInterval(loadInterval);
    messageDiv.innerText = `Error: Cannot connect to AI network.`;
    messageDiv.style.color = '#f87171';
  }
};

form.addEventListener('submit', handleSubmit);
textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});
