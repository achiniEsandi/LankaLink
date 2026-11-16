export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.message || 'Something went wrong', data.details)
  return data
}

// Multipart upload through XHR, because fetch cannot report upload progress
export function uploadFile(path, { token, fields = {}, file, onProgress }) {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    Object.entries(fields).forEach(([key, value]) => form.append(key, value))
    form.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api${path}`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    xhr.onerror = () => reject(new ApiError(0, 'Upload failed. Check your connection and try again.'))
    xhr.onload = () => {
      let data = {}
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        // Non-JSON body; fall through with an empty object
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data)
      else reject(new ApiError(xhr.status, data.message || 'Upload failed', data.details))
    }
    xhr.send(form)
  })
}

// Protected files need the auth header, so they are fetched as blobs and shown via object URLs
export async function fetchFile(path, { token }) {
  const res = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new ApiError(res.status, 'Could not load the file')
  return res.blob()
}
