const style = document.createElement('style')
style.textContent = `
  .dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #5A7A8A;
    margin: 0 2px;
    animation: brio-bounce 1s infinite;
  }
  .dot:nth-child(2) { animation-delay: 0.15s; }
  .dot:nth-child(3) { animation-delay: 0.3s; }
  @keyframes brio-bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
  }
  .message {
    margin-bottom: 16px;
    max-width: 75%;
    line-height: 1.55;
    font-size: 14px;
    padding: 10px 14px;
    border-radius: 4px 18px 18px 18px;
    background: white;
    border: 1px solid #C2EDE4;
    color: #0D1F2D;
  }
  .user-message {
    margin-left: auto;
    background: #00C9A7;
    color: white;
    border: none;
    border-radius: 18px 18px 4px 18px;
  }
  .pace-message {
    margin-right: auto;
  }
`
document.head.appendChild(style)

let messages = []
let isLoading = false
let stravaData = [
  { type: 'Run', distance: 18200, moving_time: 6240, average_heartrate: 158, start_date: new Date(Date.now() - 1*86400000).toISOString(), name: 'Morning Long Run' },
  { type: 'Run', distance: 8400, moving_time: 3210, average_heartrate: 142, start_date: new Date(Date.now() - 2*86400000).toISOString(), name: 'Easy Recovery Run' },
  { type: 'Run', distance: 12700, moving_time: 3810, average_heartrate: 163, start_date: new Date(Date.now() - 3*86400000).toISOString(), name: 'Tempo Intervals' },
  { type: 'Run', distance: 13100, moving_time: 4650, average_heartrate: 152, start_date: new Date(Date.now() - 5*86400000).toISOString(), name: 'Base Aerobic Run' }
]
let userProfile = { name: 'Yi Zhang', goal: 'Boston Qualifier marathon', weight_kg: 70 }

function scrollToBottom() {
  const msgs = document.getElementById('messages')
  msgs.scrollTop = msgs.scrollHeight
}

function appendUserMessage(text) {
  const msgs = document.getElementById('messages')
  const div = document.createElement('div')
  div.className = 'message user-message'
  div.textContent = text
  msgs.appendChild(div)
  scrollToBottom()
}

function appendPaceMessage(id) {
  const msgs = document.getElementById('messages')
  const div = document.createElement('div')
  div.className = 'message pace-message'
  if (id) div.id = id
  msgs.appendChild(div)
  scrollToBottom()
  return div
}

function showTyping() {
  const el = appendPaceMessage('typing-indicator')
  el.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>'
}

function removeTyping() {
  const el = document.getElementById('typing-indicator')
  if (el) el.remove()
}

async function sendMessage() {
  if (isLoading) return
  const input = document.getElementById('user-input')
  const text = input.value.trim()
  if (!text) return

  input.value = ''
  input.style.height = 'auto'

  const welcome = document.getElementById('welcome')
  if (welcome) welcome.remove()
  const chips = document.getElementById('chips')
  if (chips) chips.style.display = 'none'

  appendUserMessage(text)
  messages.push({ role: 'user', content: text })

  showTyping()
  isLoading = true
  document.getElementById('send-btn').disabled = true

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, stravaData, userProfile, tier: 'fast' })
    })

    if (!response.ok) throw new Error('Server error')

    removeTyping()
    const msgEl = appendPaceMessage('current-response')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6).trim()
        if (!data || data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          if (parsed.text) {
            fullText += parsed.text
            msgEl.textContent = fullText
            scrollToBottom()
          }
          if (parsed.error) {
            msgEl.textContent = 'Sorry, something went wrong. Please try again.'
          }
        } catch (e) {
          // skip malformed chunks
        }
      }
    }

    msgEl.removeAttribute('id')
    messages.push({ role: 'assistant', content: fullText })

  } catch (err) {
    removeTyping()
    const errEl = appendPaceMessage('error-msg')
    errEl.textContent = 'Sorry, I could not reach Pace. Make sure the server is running.'
  }

  isLoading = false
  document.getElementById('send-btn').disabled = false
  document.getElementById('user-input').focus()
}

window.sendMessage = sendMessage
window.handleKey = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
window.autoResize = (el) => {
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}
window.sendChip = (el) => {
  const input = document.getElementById('user-input')
  input.value = el.textContent.replace(/^[\s\S]{0,2}/, '').trim()
  sendMessage()
}
window.toggleSettings = () => {
  document.getElementById('ds-modal-backdrop').classList.toggle('active')
}
window.closeDsModal = () => {
  document.getElementById('ds-modal-backdrop').classList.remove('active')
}
window.handleDsBackdropClick = (e) => {
  if (e.target.id === 'ds-modal-backdrop') window.closeDsModal()
}
window.closeAuthModal = () => {
  document.getElementById('auth-modal').classList.remove('active')
}
window.handleBackdropClick = (e) => {
  if (e.target.id === 'auth-modal') window.closeAuthModal()
}
window.switchSettingsTab = (tab, btn) => {
  document.querySelectorAll('.settings-tab').forEach(b => b.classList.remove('active'))
  document.querySelectorAll('.settings-panel').forEach(p => p.classList.add('hidden'))
  btn.classList.add('active')
  document.getElementById('settings-panel-' + tab).classList.remove('hidden')
}
window.dsToggle = (platform) => console.log('Toggle:', platform)
window.confirmConnect = () => console.log('Confirm connect')