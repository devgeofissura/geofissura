const postgres = require("postgres")
const bcrypt = require("bcryptjs")

async function check() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false })
  try {
    const [user] = await sql`
      SELECT id, email, password, role FROM usuarios WHERE email = 'devtiagoabreu@gmail.com'
    `
    if (!user) { console.log("Usuário não encontrado"); return }
    console.log("Email:", user.email)
    console.log("Role:", user.role)
    console.log("Hash:", user.password.substring(0, 25) + "...")
    console.log("Senha correta:", bcrypt.compareSync("Estoicismo&70x7", user.password))
  } catch(e) { console.error(e.message) }
  finally { await sql.end() }
}
check()
