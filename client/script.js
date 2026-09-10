import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let engine;
let isLoaded = false;

// UI element to show model download progress
const statusText = document.createElement('div');
statusText.style.color = '#a3a3a3';
statusText.style.textAlign = 'center';
statusText.style.padding = '10px';
chatContainer.appendChild(statusText);

// Initialize WebLLM in the browser
async function initAI() {
    try {
        engine = await CreateMLCEngine(
            "Llama-3.2-1B-Instruct-q4f16_1-MLC",
            { 
                initProgressCallback: (progress) => {
                    statusText.innerText = progress.text; // e.g., "Downloading... 45%"
                }
            }
        );
        statusText.innerText = 'Model loaded successfully. AI is ready!';
        isLoaded = true;
    } catch (error) {
        statusText.innerText = `Error loading WebGPU: ${error.message}`;
    }
}
initAI();

// Your existing generateUniqueId and chatStripe functions go here...
// (Keep your existing UI formatting functions untouched)

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return alert("Please wait for the AI model to finish downloading.");

    const data = new FormData(form);
    const userPrompt = data.get('prompt');
    
    // 1. Add user chat stripe to UI
    // chatContainer.innerHTML += chatStripe(false, userPrompt);
    form.reset();

    // 2. Add empty bot chat stripe to UI with a unique ID
    const uniqueId = "unique-id-string"; // use your generateUniqueId() here
    // chatContainer.innerHTML += chatStripe(true, " ", uniqueId);
    const messageDiv = document.getElementById(uniqueId);

    // 3. Generate response entirely in the browser
    try {
        const response = await engine.chat.completions.create({
            messages: [{ role: "user", content: userPrompt }],
            temperature: 0.7,
        });
        
        messageDiv.innerText = response.choices[0].message.content;
    } catch (error) {
        messageDiv.innerText = "Something went wrong: " + error.message;
    }
};

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) handleSubmit(e);
});
