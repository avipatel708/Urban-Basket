import { supabaseAdmin } from "../config/supabase.js"

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id

    const { data: cartItems, error } = await supabaseAdmin
      .from("cart")
      .select(`
        *,
        products (
          id,
          title,
          price,
          image_url,
          stock,
          category
        )
      `)
      .eq("user_id", userId)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json(cartItems)
  } catch (err) {
    next(err)
  }
}

export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { product_id, quantity = 1 } = req.body

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required." })
    }

    // Upsert into cart table using ON CONFLICT (user_id, product_id)
    // First, check if item already exists in cart
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("cart")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", product_id)
      .single()

    if (existing) {
      // Update quantity
      const newQty = existing.quantity + parseInt(quantity)
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("cart")
        .update({ quantity: newQty })
        .eq("id", existing.id)
        .select(`
          *,
          products (
            id,
            title,
            price,
            image_url,
            stock,
            category
          )
        `)
        .single()

      if (updateError) return res.status(400).json({ error: updateError.message })
      return res.status(200).json(updated)
    } else {
      // Insert new
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("cart")
        .insert({
          user_id: userId,
          product_id,
          quantity: parseInt(quantity),
        })
        .select(`
          *,
          products (
            id,
            title,
            price,
            image_url,
            stock,
            category
          )
        `)
        .single()

      if (insertError) return res.status(400).json({ error: insertError.message })
      return res.status(201).json(inserted)
    }
  } catch (err) {
    next(err)
  }
}

export const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { quantity } = req.body

    if (quantity === undefined || parseInt(quantity) <= 0) {
      return res.status(400).json({ error: "Invalid quantity value." })
    }

    const { data, error } = await supabaseAdmin
      .from("cart")
      .update({ quantity: parseInt(quantity) })
      .eq("id", id)
      .eq("user_id", userId)
      .select(`
        *,
        products (
          id,
          title,
          price,
          image_url,
          stock,
          category
        )
      `)
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

export const removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const { error } = await supabaseAdmin
      .from("cart")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ message: "Item removed from cart." })
  } catch (err) {
    next(err)
  }
}

export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id

    const { error } = await supabaseAdmin
      .from("cart")
      .delete()
      .eq("user_id", userId)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ message: "Cart cleared successfully." })
  } catch (err) {
    next(err)
  }
}
