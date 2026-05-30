import { supabaseAdmin } from "../config/supabase.js"

export const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id

    const { data: wishlistItems, error } = await supabaseAdmin
      .from("wishlist")
      .select(`
        *,
        products (
          id,
          title,
          price,
          image_url,
          stock,
          category,
          rating
        )
      `)
      .eq("user_id", userId)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json(wishlistItems)
  } catch (err) {
    next(err)
  }
}

export const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { product_id } = req.body

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required." })
    }

    // Insert or ignore if conflict (user_id, product_id unique constraint)
    const { data, error } = await supabaseAdmin
      .from("wishlist")
      .upsert(
        { user_id: userId, product_id },
        { onConflict: "user_id, product_id" }
      )
      .select(`
        *,
        products (
          id,
          title,
          price,
          image_url,
          stock,
          category,
          rating
        )
      `)
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(201).json(data)
  } catch (err) {
    next(err)
  }
}

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params
    const userId = req.user.id

    const { error } = await supabaseAdmin
      .from("wishlist")
      .delete()
      .eq("product_id", productId)
      .eq("user_id", userId)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ message: "Product removed from wishlist." })
  } catch (err) {
    next(err)
  }
}
