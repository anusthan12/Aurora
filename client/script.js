import bot from './assets/bot.svg'
import user from './assets/user.svg'
import * as webllm from "https://esm.run/@mlc-ai/web-llm"

// The model runs entirely in the visitor's browser (WebGPU). No server,
// no API key, no cost — ever. First load downloads the model once and
// caches it in the browser for next time.
const MODEL = "Llama-3.2-1B-Instruct-q4f32_1-MLC"

const form = document.querySelector('form')
const chatContainer = document.querySelector('#chat_container')

let loadInterval
let engine = null
let history = []

function loader(element) {
    element.textContent = ''
    loadInterval = setInterval(() => {
        element.textContent += '.'
        if (element.textContent === '....') {
            element.textContent = ''
        }
    }, 300)
}

function typeText(element, text) {
    let index = 0
    let interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index)
            index++
        } else {
            clearInterval(interval)
        }
    }, 20)
}

function generateUniqueId() {
    const timestamp = Date.now()
    const randomNumber = Math.random()
    const hexadecimalString = randomNumber.toString(16)
    return `id-${timestamp}-${hexadecimalString}`
}

function chatStripe(isAi, value, uniqueId) {
    return (
        `
        <div class="wrapper ${isAi && 'ai'}">
            <div class="chat">
                <div class="profile">
                    <img
                      src=${isAi ? bot : user}
                      alt="${isAi ? 'bot' : 'user'}"
                    />
                </div>
                <div class="message" id=${uniqueId}>${value}</div>
            </div>
        </div>
    `
    )
}

// Loads the model on first use and shows progress in the heading.
async function ensureEngineReady() {
    if (engine) return engine

    const heading = document.querySelector('#heading')
    engine = await webllm.CreateMLCEngine(MODEL, {
        initProgressCallback: (report) => {
            heading.textContent = report.text || 'Loading model…'
        }
    })
    heading.textContent = 'Aurora'
    return engine
}

const handleSubmit = async (e) => {
    e.preventDefault()

    const data = new FormData(form)
    const prompt = data.get('prompt')
    if (!prompt || !prompt.trim()) return

    chatContainer.innerHTML += chatStripe(false, prompt)
    form.reset()

    const uniqueId = generateUniqueId()
    chatContainer.innerHTML += chatStripe(true, " ", uniqueId)
    chatContainer.scrollTop = chatContainer.scrollHeight

    const messageDiv = document.getElementById(uniqueId)
    loader(messageDiv)

    try {
        const ai = await ensureEngineReady()

        history.push({ role: 'user', content: prompt })

        const reply = await ai.chat.completions.create({
            messages: history,
            temperature: 0.7
        })

        const text = reply.choices[0].message.content.trim()
        history.push({ role: 'assistant', content: text })
        history = history.slice(-20) // keep it light

        clearInterval(loadInterval)
        messageDiv.innerHTML = " "
        typeText(messageDiv, text)

    } catch (error) {
        clearInterval(loadInterval)
        console.error(error)
        messageDiv.innerHTML = "Something went wrong loading or running the model."
        alert(String(error.message || error))
    }
}

form.addEventListener('submit', handleSubmit)
form.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        handleSubmit(e)
    }
})

// Warm up the model as soon as the page loads so the first message is fast.
ensureEngineReady().catch(err => {
    console.error('Model preload failed:', err)
    document.querySelector('#heading').textContent = 'Aurora (tap to retry loading)'
})
