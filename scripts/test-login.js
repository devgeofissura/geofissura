const https = require("https")

function post(url, data, cookie) {
  return new Promise((resolve) => {
    const body = JSON.stringify(data)
    const opts = {
      method: "POST", hostname: "geofissura.vercel.app", path: url,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        ...(cookie ? { Cookie: cookie } : {}),
      },
    }
    const req = https.request(opts, (res) => {
      let b = ""
      res.on("data", c => b += c)
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: b }))
    })
    req.on("error", (e) => resolve({ error: e.message }))
    req.write(body)
    req.end()
  })
}

async function main() {
  const csrfRes = await new Promise((resolve) => {
    https.get("https://geofissura.vercel.app/api/auth/csrf", (res) => {
      let b = ""
      res.on("data", c => b += c)
      res.on("end", () => {
        const cookie = (res.headers["set-cookie"] || []).join("; ")
        resolve({ token: JSON.parse(b).csrfToken, cookie })
      })
    })
  })

  const login = await post("/api/auth/callback/credentials", {
    email: "devtiagoabreu@gmail.com",
    password: "Estoicismo&70x7",
    csrfToken: csrfRes.token,
  }, csrfRes.cookie)

  console.log("Status:", login.status)
  console.log("Location:", login.headers?.location)
}
main()
