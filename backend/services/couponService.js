import { formatCurrency } from "../utils/formatCurrency.js";
import { couponStore } from "../utils/couponStore.js";

const ALLOWED_CREATE_FIELDS = [
  "coupon_code",
  "discount_type",
  "discount_value",
  "minimum_order_amount",
  "maximum_discount",
  "expiry_date",
  "usage_limit",
  "first_order_only",
  "user_specific_expiry",
  "random_discount_enabled",
  "random_discount_min",
  "random_discount_max",
];

function pickAllowedFields(data) {
  const picked = {};
  for (const field of ALLOWED_CREATE_FIELDS) {
    if (data[field] !== undefined) {
      picked[field] = data[field];
    }
  }
  return picked;
}

function formatCouponPayload(couponData) {
  const safeData = pickAllowedFields(couponData);

  return {
    coupon_code: safeData.coupon_code.trim().toUpperCase(),
    discount_type: safeData.discount_type,
    discount_value: parseFloat(safeData.discount_value),
    minimum_order_amount: safeData.minimum_order_amount
      ? parseFloat(safeData.minimum_order_amount)
      : 0,
    maximum_discount: safeData.maximum_discount
      ? parseFloat(safeData.maximum_discount)
      : null,
    expiry_date: safeData.expiry_date
      ? new Date(safeData.expiry_date).toISOString()
      : null,
    usage_limit: safeData.usage_limit ? parseInt(safeData.usage_limit, 10) : 0,
    user_specific_expiry: safeData.user_specific_expiry
      ? parseInt(safeData.user_specific_expiry, 10)
      : 0,
    random_discount_enabled: !!safeData.random_discount_enabled,
    random_discount_min: safeData.random_discount_min
      ? parseFloat(safeData.random_discount_min)
      : 0,
    random_discount_max: safeData.random_discount_max
      ? parseFloat(safeData.random_discount_max)
      : 0,
    first_order_only: !!safeData.first_order_only,
  };
}

function validateCreatePayload(payload) {
  if (!payload.coupon_code?.trim()) {
    throw new Error("Coupon code is required.");
  }

  if (!["percentage", "fixed"].includes(payload.discount_type)) {
    throw new Error("Discount type must be either 'percentage' or 'fixed'.");
  }

  if (!payload.discount_value || payload.discount_value <= 0 || Number.isNaN(payload.discount_value)) {
    throw new Error("Discount value must be greater than 0.");
  }

  if (payload.discount_type === "percentage" && payload.discount_value > 100) {
    throw new Error("Percentage discount cannot exceed 100%.");
  }

  if (
    payload.random_discount_enabled &&
    payload.random_discount_max > 0 &&
    payload.random_discount_min >= payload.random_discount_max
  ) {
    throw new Error("Random discount max must be greater than min.");
  }
}

/**
 * Validates a coupon for a given cart total and user ID.
 */
export async function validateAndApplyCoupon(couponCode, cartTotal, userId) {
  try {
    if (!couponCode?.trim()) {
      return { valid: false, message: "Coupon code is required." };
    }

    if (cartTotal === undefined || cartTotal === null || Number.isNaN(cartTotal) || cartTotal < 0) {
      return { valid: false, message: "A valid cart total is required." };
    }

    const coupon = await couponStore.findCouponByCode(couponCode);

    if (!coupon) {
      return { valid: false, message: "Invalid promo code." };
    }

    if (!coupon.is_active) {
      return { valid: false, message: "This coupon is no longer active." };
    }

    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return { valid: false, message: "This coupon has expired." };
    }

    const minAmount = parseFloat(coupon.minimum_order_amount || 0);
    if (cartTotal < minAmount) {
      return {
        valid: false,
        message: `This coupon requires a minimum order of ${formatCurrency(minAmount)}.`,
      };
    }

    if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
      return { valid: false, message: "This coupon has reached its overall usage limit." };
    }

    const usage = await couponStore.getUserCouponUsage(userId, coupon.id);
    if (usage) {
      return { valid: false, message: "You have already used this coupon code." };
    }

    if (coupon.first_order_only) {
      const orderCount = await couponStore.getUserOrderCount(userId);
      if (orderCount > 0) {
        const code = String(coupon.coupon_code || couponCode).trim().toUpperCase();
        const message =
          code === "WELCOME50"
            ? "WELCOME50 is only valid for first order."
            : "This coupon is only available for your first order.";
        return { valid: false, message };
      }
    }

    if (coupon.user_specific_expiry > 0) {
      const createdAt = await couponStore.getUserProfileCreatedAt(userId);
      const registrationDate = new Date(createdAt);
      const expiryTime =
        registrationDate.getTime() + coupon.user_specific_expiry * 24 * 60 * 60 * 1000;

      if (Date.now() > expiryTime) {
        return {
          valid: false,
          message: `This coupon is only valid within ${coupon.user_specific_expiry} days of registration.`,
        };
      }
    }

    let discountValue = parseFloat(coupon.discount_value);
    let isRandomApplied = false;

    if (coupon.random_discount_enabled && coupon.discount_type === "percentage") {
      const minRandom = parseFloat(coupon.random_discount_min || 0);
      const maxRandom = parseFloat(coupon.random_discount_max || 0);
      if (maxRandom > minRandom) {
        const range = maxRandom - minRandom;
        discountValue = minRandom + Math.random() * range;
        discountValue = parseFloat(discountValue.toFixed(2));
        isRandomApplied = true;
      }
    }

    let calculatedDiscount = 0;
    let discountPercentage = 0;

    if (coupon.discount_type === "percentage") {
      discountPercentage = discountValue;
      calculatedDiscount = cartTotal * (discountValue / 100);

      if (coupon.maximum_discount && calculatedDiscount > parseFloat(coupon.maximum_discount)) {
        calculatedDiscount = parseFloat(coupon.maximum_discount);
      }
    } else if (coupon.discount_type === "fixed") {
      calculatedDiscount = discountValue;
      discountPercentage = parseFloat(((discountValue / cartTotal) * 100).toFixed(2));

      if (calculatedDiscount > cartTotal) {
        calculatedDiscount = cartTotal;
      }
    } else {
      return { valid: false, message: "This coupon has an invalid discount type." };
    }

    calculatedDiscount = parseFloat(calculatedDiscount.toFixed(2));

    const finalMessage = isRandomApplied
      ? `Lucky discount applied! You got a random ${discountValue}% off, saving ${formatCurrency(calculatedDiscount)}.`
      : `Coupon applied successfully! Saved ${formatCurrency(calculatedDiscount)}.`;

    return {
      valid: true,
      discount: calculatedDiscount,
      discountPercentage,
      message: finalMessage,
      coupon: {
        ...coupon,
        discount_value: discountValue,
      },
    };
  } catch (err) {
    console.error("validateAndApplyCoupon exception:", err);
    return {
      valid: false,
      message: err.message || "An unexpected error occurred during coupon validation.",
    };
  }
}

export async function recordCouponUsage(userId, couponId, discountReceived) {
  return couponStore.recordUsage(userId, couponId, discountReceived);
}

export async function createCoupon(couponData, sellerId) {
  const payload = formatCouponPayload(couponData);
  validateCreatePayload(payload);

  return couponStore.insertCoupon({
    ...payload,
    created_by: sellerId,
  });
}

export async function getCoupons(sellerId) {
  return couponStore.listCouponsBySeller(sellerId);
}

export async function updateCoupon(couponId, updates, sellerId) {
  const formattedUpdates = pickAllowedFields(updates);

  if (updates.coupon_code) {
    formattedUpdates.coupon_code = updates.coupon_code.trim().toUpperCase();
  }
  if (updates.discount_value !== undefined) {
    formattedUpdates.discount_value = parseFloat(updates.discount_value);
  }
  if (updates.minimum_order_amount !== undefined) {
    formattedUpdates.minimum_order_amount = parseFloat(updates.minimum_order_amount);
  }
  if (updates.maximum_discount !== undefined) {
    formattedUpdates.maximum_discount = updates.maximum_discount
      ? parseFloat(updates.maximum_discount)
      : null;
  }
  if (updates.expiry_date !== undefined) {
    formattedUpdates.expiry_date = updates.expiry_date
      ? new Date(updates.expiry_date).toISOString()
      : null;
  }
  if (updates.usage_limit !== undefined) {
    formattedUpdates.usage_limit = parseInt(updates.usage_limit, 10);
  }
  if (updates.user_specific_expiry !== undefined) {
    formattedUpdates.user_specific_expiry = parseInt(updates.user_specific_expiry, 10);
  }
  if (updates.random_discount_enabled !== undefined) {
    formattedUpdates.random_discount_enabled = !!updates.random_discount_enabled;
  }
  if (updates.random_discount_min !== undefined) {
    formattedUpdates.random_discount_min = parseFloat(updates.random_discount_min);
  }
  if (updates.random_discount_max !== undefined) {
    formattedUpdates.random_discount_max = parseFloat(updates.random_discount_max);
  }
  if (updates.first_order_only !== undefined) {
    formattedUpdates.first_order_only = !!updates.first_order_only;
  }
  if (updates.is_active !== undefined) {
    formattedUpdates.is_active = !!updates.is_active;
  }

  return couponStore.updateCouponRecord(couponId, formattedUpdates, sellerId);
}

export async function deleteCoupon(couponId, sellerId) {
  return couponStore.deleteCouponRecord(couponId, sellerId);
}

export async function getCouponStats(sellerId) {
  const coupons = await couponStore.listCouponsBySeller(sellerId);

  const now = new Date();
  let totalActive = 0;
  let totalUsage = 0;
  let expiredCount = 0;

  coupons.forEach((coupon) => {
    if (coupon.is_active) {
      if (coupon.expiry_date && new Date(coupon.expiry_date) < now) {
        expiredCount++;
      } else {
        totalActive++;
      }
    } else if (coupon.expiry_date && new Date(coupon.expiry_date) < now) {
      expiredCount++;
    }
    totalUsage += coupon.used_count || 0;
  });

  const couponIds = coupons.map((c) => c.id);
  const usageRecords = await couponStore.getUsageForCoupons(couponIds);
  const totalDiscountGiven = usageRecords.reduce(
    (acc, curr) => acc + parseFloat(curr.discount_received || 0),
    0
  );

  return {
    totalActive,
    totalUsage,
    totalDiscountGiven: parseFloat(totalDiscountGiven.toFixed(2)),
    expiredCount,
  };
}
