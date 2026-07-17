<script>
  let { data } = $props();
</script>

<h1>Chats</h1>

<form method="POST">
  <button type="submit">New Chat</button>
</form>

{#if data.conversations.length === 0}
  <p>No conversations yet.</p>
{:else}
  <ul>
    {#each data.conversations as conv}
      <li>
        <a href="/chats/{conv.slug}">{conv.title}</a>
        <span class="date">{conv.updated_at?.toLocaleString()}</span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .date {
    color: #999;
    font-size: 0.8rem;
    margin-left: 0.5rem;
  }
</style>
