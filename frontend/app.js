const style = document.createElement('style')
style.textContent = `
  .dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #5A7A8A;
    margin: 0 2px;
    animation: terra-bounce 1s infinite;
  }
  .dot:nth-child(2) { animation-delay: 0.15s; }
  .dot:nth-child(3) { animation-delay: 0.3s; }
  @keyframes terra-bounce {
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
    background: #0a2e1e;
    border: 1px solid #0f4530;
    color: #e0f5ef;
  }
  .user-message {
    margin-left: auto;
    background: #176644;
    color: white;
    border: none;
    border-radius: 18px 18px 4px 18px;
  }
  .terra-message {
    margin-right: auto;
  }
  .terra-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 16px;
  }
  .terra-avatar {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    flex-shrink: 0;
  }
  .terra-row .message {
    margin-bottom: 0;
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

function appendTerraMessage(id) {
  const msgs = document.getElementById('messages')
  const row = document.createElement('div')
  row.className = 'terra-row'
  const div = document.createElement('div')
  div.className = 'message terra-message'
  if (id) div.id = id
  row.appendChild(div)
  msgs.appendChild(row)
  scrollToBottom()
  return div
}

function showTyping() {
  const el = appendTerraMessage('typing-indicator')
  el.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>'
}

function removeTyping() {
  const el = document.getElementById('typing-indicator')
  if (el) (el.closest('.terra-row') || el).remove()
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
    const msgEl = appendTerraMessage('current-response')

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
    const errEl = appendTerraMessage('error-msg')
    errEl.textContent = 'Sorry, I could not reach Terra. Make sure the server is running.'
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
  document.getElementById('send-btn').disabled = !el.value.trim()
}
window.sendChip = (el) => {
  const input = document.getElementById('user-input')
  input.value = el.textContent.replace(/^[\s\S]{0,2}/, '').trim()
  sendMessage()
}
window.toggleSettings = () => {
  document.getElementById('ds-modal-backdrop').classList.toggle('open')
  document.getElementById('settings-btn').classList.toggle('active')
}
window.closeDsModal = () => {
  document.getElementById('ds-modal-backdrop').classList.remove('open')
  document.getElementById('settings-btn').classList.remove('active')
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

window.handleVoiceInput = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert('Voice input requires a secure connection (HTTPS or localhost). Please access the app via the server rather than opening the file directly.');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    const btn = document.getElementById('voice-btn');
    btn.classList.toggle('recording');
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      alert('Microphone access was denied. Please allow microphone access in your browser settings.');
    } else if (err.name === 'NotFoundError') {
      alert('No microphone found. Please connect a microphone and try again.');
    } else {
      alert('Could not access microphone: ' + err.message);
    }
  }
}

window.handleCameraInput = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert('Camera input requires a secure connection (HTTPS or localhost). Please access the app via the server rather than opening the file directly.');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(t => t.stop());
    alert('Camera access granted. Camera input coming soon.');
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      alert('Camera access was denied. Please allow camera access in your browser settings.');
    } else if (err.name === 'NotFoundError') {
      alert('No camera found. Please connect a camera and try again.');
    } else {
      alert('Could not access camera: ' + err.message);
    }
  }
}

document.getElementById('send-btn').disabled = true;