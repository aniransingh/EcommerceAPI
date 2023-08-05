const express = require("express");
const router = express.Router();
const {
    authenticateUser,
    authorizePermissions,
} = require("../middleware/authentication");

const {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    uploadImage,
} = require("../controllers/productController");

const { getSingleProductReviews } = require("../controllers/reviewController");

router
    .route("/")
    .post([authenticateUser, authorizePermissions("admin")], createProduct)
    .get(getAllProducts);
router
    .route("/uploadImage")
    .post([authenticateUser, authorizePermissions("admin")], uploadImage);
router
    .route("/:id")
    .get(getSingleProduct)
    .patch(updateProduct)
    .delete(deleteProduct);

router.route("/:id/reviews").get(getSingleProductReviews);

module.exports = router;
