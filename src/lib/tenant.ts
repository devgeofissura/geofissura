import { auth } from "./auth"

export async function getSession() {
  const session = await auth()
  const role = session?.user?.role
  const tenantId = session?.user?.tenantId
  const isSuper = role === "SUPER"
  return { session, tenantId, role, isSuper }
}
