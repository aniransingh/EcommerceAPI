const Order = require("../models/Order");
const Product = require("../models/Product");
const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");
const { checkPermissions } = require("../utils");

const fakeStripeAPI = async ({ amount, currency }) => {
    const clientSecret = "randomValue";

    return { clientSecret, amount };
};

const createOrder = async (req, res) => {
    const { items: cartItems, tax, shippingFee } = req.body;

    if (!cartItems || cartItems.length < 1)
        throw new BadRequestError("No cart items provided");

    if (!tax || !shippingFee)
        throw new BadRequestError("Please provide tax and shipping fee");

    let orderItems = [];
    let subtotal = 0;

    for (const item of cartItems) {
        const dbProduct = await Product.findOne({ _id: item.product });

        if (!dbProduct)
            throw new NotFoundError(`No product with id : ${item.product}`);

        const { name, price, image, _id } = dbProduct;
        const singleOrderItem = {
            amount: item.amount,
            name,
            price,
            image,
            product: _id,
        };

        orderItems = [...orderItems, singleOrderItem];

        subtotal += item.amount * price;
    }

    const total = subtotal + shippingFee + subtotal;

    const paymentIntent = await fakeStripeAPI({
        amount: total,
        currency: "usd",
    });

    const order = await Order.create({
        orderItems,
        total,
        subtotal,
        tax,
        shippingFee,
        clientSecret: paymentIntent.clientSecret,
        user: req.user.userId,
    });

    return res
        .status(StatusCodes.CREATED)
        .json({ order, clientSecret: order.clientSecret });
};

const getAllOrders = async (req, res) => {
    const orders = await Order.find({});

    return res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const getSingleOrder = async (req, res) => {
    const { id: orderId } = req.params;

    const order = await Order.findOne({ _id: orderId });

    if (!order) throw new NotFoundError(`No product with id : ${orderId}`);

    checkPermissions(req.user, order.user);

    return res.status(StatusCodes.OK).json({ order });
};

const getCurrentUserOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user.userId });

    return res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const updateOrder = async (req, res) => {
    const { id: orderId } = req.params;
    const { paymentIntentId } = req.body;

    const order = await Order.findOne({ _id: orderId });

    if (!order) throw new NotFoundError(`No product with id : ${orderId}`);

    checkPermissions(req.user, order.user);

    order.paymentIntentId = paymentIntentId;
    order.status = "paid";

    await order.save();

    return res
        .status(StatusCodes.OK)
        .json({ msg: "order updated successfully" });
};

module.exports = {
    createOrder,
    getAllOrders,
    getSingleOrder,
    getCurrentUserOrders,
    updateOrder,
};
