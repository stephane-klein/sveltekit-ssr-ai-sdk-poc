<script>
  let { data } = $props();
</script>

<h1>Contacts</h1>

{#if data.contacts.length === 0}
  <p>No contacts found.</p>
{:else}
  <table>
    <thead>
      <tr>
        <th>First name</th>
        <th>Last name</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      {#each data.contacts as contact}
        <tr>
          <td>{contact.firstname}</td>
          <td>{contact.lastname}</td>
          <td>{contact.created_at?.toLocaleDateString()}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
