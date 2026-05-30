import { supabase } from "@/supabase/client"
import { getToken } from "./api"

export async function uploadProductImage(file: File, sellerId: string): Promise<string> {
  const token = getToken()
  const formData = new FormData()
  formData.append("file", file)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const res = await fetch(`${API_URL}/products/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || "Failed to upload image")
  }

  const data = await res.json()
  return data.url
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split(".").pop()
  const fileName = `${userId}/avatar.${fileExt}`

  const { error } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    })

  if (error) throw error

  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName)

  return data.publicUrl
}

export async function deleteProductImage(imageUrl: string) {
  const path = imageUrl.split("/product-images/")[1]
  if (!path) return

  const { error } = await supabase.storage
    .from("product-images")
    .remove([path])

  if (error) throw error
}
