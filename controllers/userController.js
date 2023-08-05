const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const {
    NotFoundError,
    BadRequestError,
    UnauthenticatedError,
} = require("../errors");
const {
    createTokenUser,
    attachCookiesToResponse,
    checkPermissions,
} = require("../utils");

const getAllUsers = async (req, res) => {
    console.log(req.user);
    const users = await User.find({ role: "user" }).select("-password");

    return res.status(StatusCodes.OK).json({ users });
};

const getSingleUser = async (req, res) => {
    const { id } = req.params;

    const user = await User.findOne({ _id: id }).select("-password");

    if (!user) {
        throw new NotFoundError(`No user with id: ${id}`);
    }

    checkPermissions(req.user, user._id);

    return res.status(StatusCodes.OK).json({ user });
};

const showCurrentUser = async (req, res) => {
    return res.status(StatusCodes.OK).json({ user: req.user });
};

const updateUser = async (req, res) => {
    const { email, name } = req.body;

    if (!email || !name) throw new BadRequestError("Please provide all values");

    const user = await User.findOneAndUpdate(
        { _id: req.user.userId },
        { name, email },
        { new: true, runValidators: true }
    );

    const tokenUser = createTokenUser(user);
    attachCookiesToResponse({ res, user: tokenUser });

    return res.status(StatusCodes.OK).json({ user: tokenUser });
};

const updateUserPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
        throw new BadRequestError("Please provide both values");

    const user = await User.findOne({ _id: req.user.userId });

    const isPasswordCorrect = await user.comparePassword(oldPassword);

    if (!isPasswordCorrect)
        throw new UnauthenticatedError("Invalid credentials");

    user.password = newPassword;
    await user.save();

    return res.status(StatusCodes.OK).json({ msg: "password updated" });
};

module.exports = {
    getAllUsers,
    getSingleUser,
    showCurrentUser,
    updateUser,
    updateUserPassword,
};
