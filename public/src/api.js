export async function pingServer() {
  const res = await fetch('/connected', {
    headers: {
      'X-Client-Id': clientId
    }
  });

  if (!res.ok) throw new Error('Servidor no responde');
  return res.json();
}

export async function joinQueue(nickname) {
  const res = await fetch('/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname })
  });

  return res.json();
}

export async function loginPlayer(nickname, color) {
  const res = await fetch('/players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, color })
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Login fallido');
  } return res.json();
}

export async function updatePlayer(nickname, data) {
  const res = await fetch(`/players/${nickname}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error('Update fallido');
  return res.json();
}

export async function logoutPlayer(nickname) {
  await fetch(`/players/${nickname}`, {
    method: 'DELETE'
  });
}
