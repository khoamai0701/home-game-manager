export function authHeaders() {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

export function getCurrentUserId() {
  const token = localStorage.getItem('token')
  const payload = token.split('.')[1]
  const decoded = atob(payload)
  const user = JSON.parse(decoded)

  return user.userId
}