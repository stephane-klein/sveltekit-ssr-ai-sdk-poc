<script>
  import { Chat } from '@ai-sdk/svelte';
  import { DefaultChatTransport } from 'ai';
  import { renderMarkdown } from '$lib/markdown.js';
  import 'highlight.js/styles/github-dark.css';

  let { data } = $props();

  const initialMessages = data.messages.map((m, i) => ({
    id: `${data.conversation.slug}-${i}`,
    role: m.role,
    content: m.content,
    parts: [{ type: 'text', text: m.content }],
  }));

  const chat = new Chat({
    id: data.conversation.slug,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: `/chats/${data.conversation.slug}` }),
  });

  let input = $state('');
  let reasoningLevel = $state('none');
  const disabled = $derived(chat.status !== 'ready');

  let title = $state(data.conversation.title);
  let generatingTitle = $state(false);

  async function generateTitle() {
    if (generatingTitle || disabled) return;
    generatingTitle = true;
    try {
      const response = await fetch(`/chats/${data.conversation.slug}/generate-title`, {
        method: 'POST',
      });
      const result = await response.json();
      if (response.ok) {
        title = result.title;
      }
    } catch {
      console.error('Failed to generate title');
    } finally {
      generatingTitle = false;
    }
  }

  let messageTimings = $state({});
  let requestStartTime = $state(null);
  let streamingStartTime = $state(null);
  let pendingMessageId = $state(null);

  let reasoningFirstSeenTime = $state(null);
  let textFirstSeenTime = $state(null);

  $effect(() => {
    const status = chat.status;

    if (status === 'streaming' && requestStartTime !== null && streamingStartTime === null) {
      streamingStartTime = Date.now();

      const lastAssistant = chat.messages
        .filter(m => m.role === 'assistant' && m.id)
        .findLast(m => !messageTimings[m.id]);

      if (lastAssistant) {
        pendingMessageId = lastAssistant.id;
      }
    }

    if (status === 'ready' && streamingStartTime !== null && pendingMessageId !== null) {
      const requestEndTime = Date.now();
      const firstVisibleTime = textFirstSeenTime ?? streamingStartTime;
      const ttft = firstVisibleTime - requestStartTime;
      const total = requestEndTime - requestStartTime;
      const stream = requestEndTime - firstVisibleTime;

      let reasoningTime = null;
      if (reasoningLevel !== 'none') {
        reasoningTime =
          reasoningFirstSeenTime !== null && textFirstSeenTime !== null
            ? textFirstSeenTime - reasoningFirstSeenTime
            : 0;
      }

      messageTimings = {
        ...messageTimings,
        [pendingMessageId]: {
          ttft,
          streamDuration: stream,
          totalTime: total,
          reasoningTime,
          reasoningLevelUsed: reasoningLevel,
        },
      };

      requestStartTime = null;
      streamingStartTime = null;
      pendingMessageId = null;
      reasoningFirstSeenTime = null;
      textFirstSeenTime = null;
    }
  });

  $effect(() => {
    const _ = chat.messages;

    if (pendingMessageId !== null && streamingStartTime !== null) {
      const msg = chat.messages.find(m => m.id === pendingMessageId);
      if (msg?.parts) {
        for (const part of msg.parts) {
          if (part.type === 'text' && part.text?.length > 0 && textFirstSeenTime === null) {
            textFirstSeenTime = Date.now();
          }
          if (reasoningLevel !== 'none' && part.type === 'reasoning' && reasoningFirstSeenTime === null) {
            reasoningFirstSeenTime = Date.now();
          }
        }
      }
    }
  });

  function formatDuration(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.round((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    requestStartTime = Date.now();
    streamingStartTime = null;
    pendingMessageId = null;
    reasoningFirstSeenTime = null;
    textFirstSeenTime = null;
    chat.sendMessage({ text: input }, { body: { reasoningLevel } });
    input = '';
  }
</script>

<h1>
  <a href="/chats">Chats</a> / {data.conversation.slug}
  <span class="title-display">— {title}</span>
  <button onclick={generateTitle} disabled={generatingTitle || disabled} class="generate-title-btn">
    {generatingTitle ? 'Generating...' : 'Generate title'}
  </button>
</h1>

<div class="chat-messages">
  {#each chat.messages as message, messageIndex (messageIndex)}
    <div class="message message--{message.role}">
      <div class="message__role">{message.role}</div>
      <div class="message__content">
        {#each message.parts as part, partIndex (partIndex)}
          {#if part.type === 'text'}
            {@html renderMarkdown(part.text)}
          {/if}
        {/each}
      </div>
      {#if message.role === 'assistant' && messageTimings[message.id]}
        <div class="timing">
          <span>TTFT: {formatDuration(messageTimings[message.id].ttft)}</span>
          <span>Stream: {formatDuration(messageTimings[message.id].streamDuration)}</span>
          <span>Total: {formatDuration(messageTimings[message.id].totalTime)}</span>
          {#if messageTimings[message.id].reasoningLevelUsed !== 'none'}
            <span class="timing--reasoning">Reasoning: {formatDuration(messageTimings[message.id].reasoningTime)}</span>
          {/if}
        </div>
      {/if}
    </div>
  {/each}
</div>

<form onsubmit={handleSubmit} class="chat-form">
  <input
    type="text"
    bind:value={input}
    placeholder="Type your message..."
    disabled={disabled}
  />
  <button type="submit" disabled={disabled}>
    Send
  </button>
</form>

<div class="reasoning-control">
    <label for="reasoning-select">Reasoning effort:</label>
    <select id="reasoning-select" bind:value={reasoningLevel} disabled={disabled}>
      <option value="none">None</option>
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>
  </div>

  {#if chat.status === 'streaming'}
    <p class="chat-status">AI is thinking...</p>
  {/if}

<style>
  .chat-messages {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .message {
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    max-width: 80%;
  }

  .message--user {
    align-self: flex-end;
    background: #e3f2fd;
  }

  .message--assistant {
    align-self: flex-start;
    background: #f5f5f5;
  }

  .message__role {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #666;
    margin-bottom: 0.25rem;
  }

  .message__content {
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .message__content :global(p) {
    margin: 0 0 0.5rem;
  }

  .message__content :global(p:last-child) {
    margin-bottom: 0;
  }

  .message__content :global(pre) {
    overflow-x: auto;
    border-radius: 0.375rem;
    margin: 0.5rem 0;
    padding: 0.75rem;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .message__content :global(code:not(pre code)) {
    background: rgba(0,0,0,0.08);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875em;
  }

  .message__content :global(ul),
  .message__content :global(ol) {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  .message__content :global(blockquote) {
    border-left: 3px solid #ccc;
    margin: 0.5rem 0;
    padding-left: 0.75rem;
    color: #555;
  }

  .message__content :global(h1),
  .message__content :global(h2),
  .message__content :global(h3),
  .message__content :global(h4) {
    margin: 0.75rem 0 0.5rem;
    font-size: 1.1em;
  }

  .message__content :global(table) {
    border-collapse: collapse;
    margin: 0.5rem 0;
    font-size: 0.875rem;
  }

  .message__content :global(th),
  .message__content :global(td) {
    border: 1px solid #ccc;
    padding: 0.375rem 0.5rem;
  }

  .message__content :global(th) {
    background: rgba(0,0,0,0.05);
    font-weight: 600;
  }

  .message__content :global(a) {
    color: #1976d2;
  }

  .chat-form {
    display: flex;
    gap: 0.5rem;
  }

  .chat-form input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid #ccc;
    border-radius: 0.375rem;
    font-size: 1rem;
  }

  .chat-form button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    background: #1976d2;
    color: #fff;
    font-size: 1rem;
    cursor: pointer;
  }

  .chat-form button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .reasoning-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #666;
  }

  .reasoning-control select {
    padding: 0.25rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  .timing {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    font-size: 0.7rem;
    color: #aaa;
    font-family: monospace;
  }

  .timing--reasoning {
    color: #e67e22;
  }

  .chat-status {
    color: #666;
    font-style: italic;
    font-size: 0.875rem;
  }

  .title-display {
    font-weight: 400;
    color: #555;
  }

  .generate-title-btn {
    margin-left: 0.75rem;
    padding: 0.2rem 0.6rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    background: #f0f0f0;
    color: #333;
    font-size: 0.75rem;
    cursor: pointer;
    vertical-align: middle;
  }

  .generate-title-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .generate-title-btn:not(:disabled):hover {
    background: #e0e0e0;
  }
</style>
