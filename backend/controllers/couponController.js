import * as couponService from "../services/couponService.js";

export const handleValidateCoupon = async (req, res, next) => {
  try {
    const { coupon_code, cart_total } = req.body;
    const userId = req.user.id;

    if (!coupon_code) {
      return res.status(400).json({ error: "Coupon code is required." });
    }

    if (cart_total === undefined || cart_total === null) {
      return res.status(400).json({ error: "Cart total is required." });
    }

    const result = await couponService.validateAndApplyCoupon(
      coupon_code,
      parseFloat(cart_total),
      userId
    );

    if (!result.valid) {
      return res.status(400).json({ ...result, error: result.message });
    }

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const handleApplyCoupon = async (req, res, next) => {
  try {
    const { coupon_code, cart_total } = req.body;
    const userId = req.user.id;

    if (!coupon_code) {
      return res.status(400).json({ error: "Coupon code is required." });
    }

    if (cart_total === undefined || cart_total === null) {
      return res.status(400).json({ error: "Cart total is required." });
    }

    const result = await couponService.validateAndApplyCoupon(
      coupon_code,
      parseFloat(cart_total),
      userId
    );

    if (!result.valid) {
      return res.status(400).json({ ...result, error: result.message });
    }

    // Record the usage in database
    await couponService.recordCouponUsage(
      userId,
      result.coupon.id,
      result.discount
    );

    return res.status(200).json({
      valid: true,
      discount: result.discount,
      discountPercentage: result.discountPercentage,
      message: "Promo code successfully applied to order!",
      coupon: result.coupon
    });
  } catch (err) {
    const message = err.message || "Failed to apply coupon.";
    return res.status(400).json({ valid: false, error: message, message });
  }
};

export const handleCreateCoupon = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const couponData = req.body;

    if (!couponData.coupon_code || !couponData.discount_type || couponData.discount_value === undefined) {
      return res.status(400).json({ 
        error: "Missing required fields: coupon_code, discount_type, and discount_value are required." 
      });
    }

    const newCoupon = await couponService.createCoupon(couponData, sellerId);
    return res.status(201).json(newCoupon);
  } catch (err) {
    const message = err.message || "Failed to create coupon.";
    return res.status(400).json({ error: message });
  }
};

export const handleGetCoupons = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const coupons = await couponService.getCoupons(sellerId);
    return res.status(200).json(coupons);
  } catch (err) {
    next(err);
  }
};

export const handleUpdateCoupon = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const updatedCoupon = await couponService.updateCoupon(id, updates, sellerId);
    return res.status(200).json(updatedCoupon);
  } catch (err) {
    next(err);
  }
};

export const handleDeleteCoupon = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    const result = await couponService.deleteCoupon(id, sellerId);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const handleGetCouponStats = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const stats = await couponService.getCouponStats(sellerId);
    return res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
};
