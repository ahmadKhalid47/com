let express = require("express");
let app = express();
let mongoose = require("mongoose");
let bodyParser = require("body-parser");
let multer = require("multer");
let PayPal = require("paypal-rest-sdk");

PayPal.configure({
  mode: "sandbox",
  client_id:
    "AdEGayejtaQJFS0emiSz3aYp5Xm1bNwHJf7w-wF_NIesyXax40F2CfZGmhun67LjEFyPpQeJMAvYp80l",
  client_secret:
    "EJPza5YQ9TIUVUig4qf_zHuP4J3WDRH8QrbdipMrNWfBKmiUBqxHksxoRyUNt9VLQllIJHmIPCP78e1c",
});

mongoose.connect("mongodb://127.0.0.1:27017/user", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const regSchema = mongoose.Schema({
  email: String,
  password: Number,
  cart: Array,
});

const productsSchema = mongoose.Schema({
  Image: String,
  Details: String,
  Quantity: Number,
  Price: Number,
  Brand: String,
  Color: String,
  Sold: Number,
});

const orderSchema = mongoose.Schema({
  user_id: String,
  product_Image: String,
  product_Detail: String,
  product_id: String,
  name: String,
  phone: Number,
  address: String,
  link: String,
});

const demy_orderSchema = mongoose.Schema({
  user_id: String,
  product_Image: String,
  product_Detail: String,
  product_id: String,
  name: String,
  phone: Number,
  address: String,
  link: String,
});

const notification_Schema = mongoose.Schema({
  image: String,
  date: String,
  detail: String,
  user_id: String,
});

const rating_Schema = mongoose.Schema({
  product_id: String,
  rate: Number,
  users: Array,
});

const productsModel = mongoose.model("product", productsSchema);
const regModel = mongoose.model("account", regSchema);
const orderModel = mongoose.model("order", orderSchema);
const demy_orderModel = mongoose.model("demy_order", demy_orderSchema);
const notification_Model = mongoose.model("notification", notification_Schema);
const ratingModel = mongoose.model("rating", rating_Schema);

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.get("/signUp", (req, res) => {
  try {
    var alreadyPresent = "";
    res.render("sign_up", { alreadyPresent });
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

app.get("/", (req, res) => {
  try {
    var loginErrors = {
      notPresent: "",
      wrongPassword: "",
    };
    res.render("login", { loginErrors });
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

app.post("/", async (req, res) => {
  try {
    var email1 = req.body.email;
    let password1 = req.body.password;
    let data = await regModel.findOne({ email: email1 });
    let userID = data._id;

    if (data == "") {
      loginErrors = {
        notPresent: "you dont have an account",
        wrongPassword: "",
      };
      res.render("login", { loginErrors });
    } else {
      if (password1 == data.password) {
        res.redirect(`/home/${userID}`);
      } else {
        loginErrors = {
          notPresent: "",
          wrongPassword: "incorrect password",
        };
        res.render("login", { loginErrors });
      }
    }
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

app.post("/signUp", async (req, res) => {
  try {
    var email1 = req.body.email;
    let password1 = req.body.password1;
    let data = await regModel.find({ email: email1 });

    if (data == "") {
      await regModel({
        email: email1,
        password: password1,
        cart: [],
      }).save();
      let tempData = await regModel.findOne({ email: email1 });
      let userID = tempData._id;
      res.redirect(`/home/${userID}`);
    } else {
      alreadyPresent = "you have already signed in";
      res.render("sign_up", { alreadyPresent });
    }
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

app.get("/home/:_id", async (req, res) => {
  try {
    let homeDetails2 = await productsModel.find({});
    let rating_array=new Array (homeDetails2.length)
    for (let i = 0; i < homeDetails2.length; i++){
      let rating_model = await ratingModel.findOne({ product_id: homeDetails2[i]._id });
      if (rating_model) {
        let rate = rating_model.rate;
        let total_users = rating_model.users.length;
        let resulted_rating = (rate / total_users).toFixed(1);
        rating_array[i] = resulted_rating;
      } else {
        rating_array[i] = 'No ratings yet';
      }
    }
    let info_obj = {
      _id: req.params._id,
      homeDetails: homeDetails2,
      resultRating: rating_array,
    };
    res.render("main_page", { info_obj });
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

app.get("/admin/:_user_id", async (req, res) => {
  try {
    if (req.params._user_id == "653fbee90ad38bb0b3cdfe4c") {
      let product_id = await productsModel.find();
      let orders = await orderModel.find();
      let info_obj = {
        _id: req.params._user_id,
        product_id1: product_id,
        order: orders,
      };
      res.render("admin_page", { info_obj });
    } else {
      res.send("this page cannot be reach by you");
    }
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

let upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public");
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "-" + Date.now() + ".jpg");
    },
  }),
});

app.post("/admin/:_user_id", upload.single("image"), async (req, res) => {
  try {
    if (req.file == null) {
      var tempImage = "notFound.jpg";
    } else {
      var tempImage = req.file.filename;
    }
    selectedImage = await productsModel({
      Image: tempImage,
      Details: req.body.Details,
      Quantity: req.body.Quantity,
      Price: req.body.Price,
      Brand: req.body.Brand,
      Color: req.body.color,
    }).save();
    res.redirect(`/admin/${req.params._user_id}`);
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

app.get("/cart/:_user_id", async (req, res) => {
  try {
    let user_id = req.params._user_id;
    const data = await regModel.findOne({ _id: user_id });

    var cart_array = [];
    for (let i = 0; i < data.cart.length; i++) {
      let finded_data = await productsModel.findOne({ _id: data.cart[i] });
      cart_array.push(finded_data);
    }

    let info_obj = {
      _id: req.params._user_id,
      cart_array1: cart_array,
    };
    res.render("cart", { info_obj });
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

app.get("/removeCart/:cart_id/:user_id", async (req, res) => {
  try {
    let cart_id = req.params.cart_id;
    let user_id = req.params.user_id;

    await regModel.updateOne({ _id: user_id }, { $pull: { cart: cart_id } });
    res.redirect(`/cart/${user_id}`);
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

app.get("/ProductDetails/:_id/:_user_id", async (req, res) => {
  try {
    let productId = await productsModel.findOne({ _id: req.params._id });

    if (productId) {
      let finded1 = await productsModel.findOne({ _id: req.params._id });
      let finded2 = await regModel.findOne({ _id: req.params._user_id });
      var response1 = "";
      if (finded2.cart.includes(req.params._id)) {
        response1 = "added";
      } else {
        response1 = "add to cart";
      }
      let info_obj = {
        response: response1,
        finded: finded1,
        _id: req.params._user_id,
      };
      res.render("details", { info_obj });
    } else {
      res.send("<h3>sorry! this product is Out of Stock</h3>");
    }
  } catch {
    res.redirect("/");
  }
});

app.get("/addToCart/:_id/:_user_id", async (req, res) => {
  try {
    let product_id = req.params._id;
    let user_id = req.params._user_id;
    await regModel.updateOne({ _id: user_id }, { $push: { cart: product_id } });
    res.redirect(`/ProductDetails/${req.params._id}/${req.params._user_id}`);
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

app.get("/buy/:_id/:_user_id", async (req, res) => {
  try {
    let productId = await productsModel.findOne({ _id: req.params._id });

    if (productId) {
      let conditions = {
        product_id: req.params._id,
        user_id: req.params._user_id,
      };
      await demy_orderModel.deleteMany(conditions);
      let info_obj = {
        product_id: req.params._id,
        _id: req.params._user_id,
      };
      res.render("address", { info_obj });
    } else {
      res.send("<h3>sorry! this product is Out of Stock</h3>");
    }
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

app.post("/buy/:_id/:_user_id", async (req, res) => {
  try {
    let product_id = await productsModel.findOne({ _id: req.params._user_id });
    let product_image = product_id.Image;
    let product_detail = product_id.Details;

    let demy_orders = await demy_orderModel({
      product_Detail: product_detail,
      product_Image: product_image,
      product_id: req.params._user_id,
      user_id: req.params._id,
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
    }).save();

    const payment = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `http://127.0.0.1:8000/success/${demy_orders._id}`,
        cancel_url: "http://127.0.0.1:8000/buy/:_id/:_user_id",
      },
      transactions: [
        {
          amount: {
            total: `${product_id.Price}`,
            currency: "USD",
          },
          description: "your description goes here",
        },
      ],
    };

    PayPal.payment.create(payment, (error, payment) => {
      if (error) {
        res.send("<h2>somthing went wrong </h2>");
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            res.redirect(payment.links[i].href);
          }
        }
      }
    });
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

app.get("/success/:_demy_id", async (req, res) => {
  try {
    let temp_orders = await demy_orderModel.findOne({
      _id: req.params._demy_id,
    });
    await orderModel({
      product_Detail: temp_orders.product_Detail,
      product_Image: temp_orders.product_Image,
      product_id: temp_orders.product_id,
      user_id: temp_orders.user_id,
      name: temp_orders.name,
      phone: temp_orders.phone,
      address: temp_orders.address,
    }).save();
    let conditions = {
      product_id: temp_orders.product_id,
      user_id: temp_orders.user_id,
    };
    await demy_orderModel.deleteMany(conditions);
    await productsModel.updateOne(
      { _id: temp_orders.product_id },
      { $inc: { Quantity: -1 } }
    );
    let product = await productsModel.findOne({ _id: temp_orders.product_id });
    if (product.Quantity <= 0) {
      await productsModel.deleteMany({ _id: temp_orders.product_id });
    }
    res.render("success");
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

app.get("/delete/:product_id", async (req, res) => {
  try {
    let product_id = req.params.product_id;
    await productsModel.deleteMany({ _id: product_id });
    res.redirect("/admin/653fbee90ad38bb0b3cdfe4c");
  } catch {
    res.send("<h2>somthing went wrong </h2>");
  }
});

app.get("/delivered/:order_id", async (req, res) => {
  res.redirect("/admin/653fbee90ad38bb0b3cdfe4c");
  let order_id = req.params.order_id;
  let order = await orderModel.findOne({ _id: order_id });
  let detail1 = order.product_Detail;
  let image1 = order.product_Image;
  let id1 = order.user_id;
  let date1 =
    new Date().getDate() +
    "/" +
    (new Date().getMonth() + 1) +
    "/" +
    new Date().getFullYear();

  await notification_Model({
    image: image1,
    detail: detail1,
    date: date1,
    user_id: id1,
  }).save();

  await orderModel.deleteMany({ _id: order_id });
});

app.get("/notification/:_id", async (req, res) => {
  try {
    let _id = req.params._id;
    let notification1 = await notification_Model.find({
      user_id: req.params._id,
    });

    var info_obj = {};
    if (notification1) {
      let check = new Array(notification1.length);
      for (let i = 0; i < notification1.length; i++) {
        let product = await productsModel.findOne({
          Details: notification1[i].detail,
        });
        if (!product) {
          check[i] = "none";
        } else {
          let rating = await ratingModel.findOne({ product_id: product._id });
          if (rating) {
            if (!rating.users.includes(req.params._id)) {
              check[i] = "display";
            } else {
              check[i] = "none";
            }
          }
        }
      }

      console.log(check);

      info_obj = {
        _id: req.params._id,
        notification: notification1,
        checker: check,
      };
      res.render("notification", { info_obj });
    } else {
      info_obj = {
        _id: req.params._id,
      };
      res.render("no_notification", { info_obj });
    }
  } catch (error) {
    res.send("something went wrong");
    // res.send(error);
  }
});

app.post("/rating/:product_detail/:user_id", async (req, res) => {
  let user_id = req.params.user_id;
  let rating_value = req.body.input;
  let product_detail1 = req.params.product_detail;
  let product = await productsModel.findOne({ Details: product_detail1 });
  let rating_model = await ratingModel.findOne({ product_id: product._id });
  if (!rating_model) {
    await ratingModel({
      product_id: product._id,
      rate: rating_value,
      users: [user_id],
    }).save();
  } else {
    await ratingModel.updateOne(
      { product_id: product._id },
      { $push: { users: user_id }, $inc: { rate: rating_value } }
    );
  }

  res.redirect(`/notification/${user_id}`);
});

app.listen(8000, () => {
  console.log("ok");
});
