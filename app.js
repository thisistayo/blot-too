const createError = require('http-errors');
const express = require('express');
const robots = require('express-robots-txt');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');


const indexRouter = require('./routes/index');
const pagesRouter = require('./routes/pages');
const postsRouter = require('./routes/posts');
const tagsRouter = require('./routes/tags');
const editRouter = require('./routes/editor');
const ssRouter = require('./routes/sandgods');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));


app.use('/', indexRouter);
app.use('/pages', pagesRouter);
app.use('/posts', postsRouter);
app.use('/tags', tagsRouter);
app.use('/editor', editRouter);
app.use('/sandgods', ssRouter);

app.use(robots({
    UserAgent: '*',
    Disallow: '/'
  }));

const methodOverride = require('method-override');
app.use(methodOverride('_method'));
// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;