/**
 * @module order/services/stock
 * @description Atomic stock deduction and rollback.
 *   Each item is deducted individually using findOneAndUpdate with $gte guard.
 *   If any item fails, all previously deducted items are rolled back.
 */

const Product = require('../../product/models/Product');
const ApiError = require('../../utils/ApiError');

/**
 * Atomically deduct stock for every item in the order.
 * Uses MongoDB's `$gte` operator to prevent over-selling.
 *
 * @param {Array<{productId, size, qty}>} items
 * @returns {Promise<Array<{productId, size, qty}>>} List of successfully deducted items
 * @throws {ApiError} 400 if any item cannot be fulfilled (auto-rollback)
 */
const deductStock = async (items) => {
  const deducted = [];

  for (const item of items) {
    const result = await Product.findOneAndUpdate(
      {
        _id: item.productId,
        status: 'available',
        [`stock.${item.size}`]: { $gte: item.qty },
      },
      { $inc: { [`stock.${item.size}`]: -item.qty } },
      { new: true }
    );

    if (!result) {
      // Rollback everything deducted so far
      await rollbackStock(deducted);

      // Produce a specific error message
      const product = await Product.findById(item.productId);
      if (!product) throw new ApiError(400, 'Product not found');
      if (product.status === 'sold-out') throw new ApiError(400, `${product.name} is sold out`);
      if (product.status !== 'available') throw new ApiError(400, `${product.name} is no longer available`);
      if (!product.sizes.includes(item.size)) throw new ApiError(400, `Size ${item.size} not available for ${product.name}`);

      const available = product.stock.get(item.size) || 0;
      throw new ApiError(400, `Insufficient stock for ${product.name} (${item.size}). Available: ${available}, requested: ${item.qty}`);
    }

    deducted.push({ productId: item.productId, size: item.size, qty: item.qty });
  }

  return deducted;
};

/**
 * Rollback previously deducted stock (restore quantities).
 * Called when a later item in the order fails.
 *
 * @param {Array<{productId, size, qty}>} deducted
 */
const rollbackStock = async (deducted) => {
  for (const item of deducted) {
    await Product.findOneAndUpdate(
      { _id: item.productId },
      { $inc: { [`stock.${item.size}`]: item.qty } }
    );
  }
};

module.exports = { deductStock, rollbackStock };
