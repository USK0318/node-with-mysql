const express = require('express');
const router = express.Router();

const userRoute = require('../controllers/userController');
const post = require('../controllers/postController');
const jwtMiddleware = require('../middlewares/jwtMiddleware');


// user routes
router.post('/register', userRoute.register);
router.post('/login', userRoute.login);
router.get('/user', jwtMiddleware, userRoute.getUserDetails);


// post routes
router.post('/post', jwtMiddleware, post.createPost);
router.get('/post', jwtMiddleware, post.getPosts);
router.get('/post/:id', jwtMiddleware, post.getPost);
router.put('/post/:id', jwtMiddleware, post.updatePost);
router.delete('/post/:id', jwtMiddleware, post.deletePost);


// like routes
router.get('/like/:id', jwtMiddleware, post.likePost);
router.get('/unlike/:id', jwtMiddleware, post.unlikePost);


// comment routes
router.post('/comment/:id', jwtMiddleware, post.commentPost);
router.delete('/comment/:commentId', jwtMiddleware, post.deleteComment);
router.put('/comment/:commentId', jwtMiddleware, post.updateComment);


module.exports = router;
