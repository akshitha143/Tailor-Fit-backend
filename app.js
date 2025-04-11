var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require("dotenv").config();
const connectToDB = require("./config/mongodb");
const authroutes = require("./routes/authRoutes");
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const bodyParser = require("body-parser");
const paymentRoutes = require("./routes/paymentRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");;
const tryonRoutes = require("./routes/tryonRoutes"); 
const TailorRoutes=require("./routes/TailorRoutes");
const measurementRoutes = require("./routes/measurementsRoutes");
var cors = require("cors");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
// Routes
app.use("/api/measurements", measurementRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authroutes);
app.use('/api/products', productRoutes);
app.use("/api/cart", cartRoutes); 
app.use("/api/payment", paymentRoutes);
app.use("/api/tryon", tryonRoutes);
app.use("/api/tailors",TailorRoutes);

app.use('/uploads', express.static('uploads'));
// Connect to MongoDB
connectToDB();
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


const PORT  =   3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
