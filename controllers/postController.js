const db = require('../config/db');
const uplodehandler = require('../middlewares/fileuplode')
const jwt = require('jsonwebtoken');


// Create a new post
const createPost = async (req, res) => {
    try {
        const { title, content } = req.body;
        console.log(title, content);

        // Extract the token from the authorization header
        const token = req.headers.authorization.split(' ')[1];
        const userid = jwt.verify(token, process.env.JWT_SECRET).id;

        // Handle file upload
        const path = await uplodehandler.handleFileUpload(req.files.img, 'post');

        // Define the query and values
        const query = 'INSERT INTO posts (user_id, title, content, img) VALUES (?, ?, ?, ?)';
        const values = [userid, title, content, path];

        await db.query(query, values);

        res.status(201).json({ message: 'Post created successfully' });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: err.message });
    }
};

// Get all posts
const getPosts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10; // Default to 10 posts per page
        const offset = parseInt(req.query.offset) || 0;

        const query = `
            SELECT 
                p.post_id,
                p.title,
                p.content,
                p.img,
                p.created_at AS post_created_at,
                u.name AS user_name,
                u.email AS user_email,
                COUNT(DISTINCT l.id) AS like_count,
                COUNT(DISTINCT c.id) AS comment_count,
                GROUP_CONCAT(DISTINCT c.comments) AS comments
            FROM 
                posts p
            JOIN 
                users u ON p.user_id = u.id
            LEFT JOIN 
                likes l ON p.post_id = l.post_id
            LEFT JOIN 
                comments c ON p.post_id = c.post_id
            GROUP BY 
                p.post_id, u.id
            ORDER BY 
                p.created_at DESC
            LIMIT ? OFFSET ?`;

        // Use the promise-based query method
        const [result] = await db.query(query, [limit, offset]);

        // Convert comments to arrays
        result.forEach(post => {
            post.comments = post.comments ? post.comments.split(',') : [];
        });

        return res.status(200).json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

// Get a single post
const getPost = async (req, res) => {
    try {
        const post_id = req.params.id;
        const query = `
            SELECT 
                p.post_id,
                p.title,
                p.content,
                p.img,
                p.created_at AS post_created_at,
                u.name AS user_name,
                u.email AS user_email,
                COUNT(DISTINCT l.id) AS like_count,
                COUNT(DISTINCT c.id) AS comment_count,
                GROUP_CONCAT(DISTINCT CONCAT(
                    cu.name, ' (', cu.email, '): ', c.comments
                ) SEPARATOR '; ') AS commenter_details
            FROM 
                posts p
            JOIN 
                users u ON p.user_id = u.id
            LEFT JOIN 
                likes l ON p.post_id = l.post_id
            LEFT JOIN 
                comments c ON p.post_id = c.post_id
            LEFT JOIN 
                users cu ON c.user_id = cu.id
            WHERE 
                p.post_id = ?
            GROUP BY 
                p.post_id, u.id
            ORDER BY 
                p.created_at DESC
        `;
        // const [result] = await db.query(query, [limit, offset]);

        const result = await db.query(query, [post_id]);

        if (result.length > 0) {
            if (result[0].commenter_details) {
                result[0].commenter_details = result[0].commenter_details.split('; ');
                for (let i = 0; i < result[0].commenter_details.length; i++) {
                    result[0].commenter_details[i] = result[0].commenter_details[i].split(': ');
                }
            }
        }
        res.status(200).json(result[0] || {});
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

// Update a post
const updatePost = async (req, res) => {
    try {
        const post_id = req.params.id;
        const { title, content } = req.body;

        // Fetch the current image path for the post
        const query1 = 'SELECT * FROM posts WHERE post_id = ?';
        const [result] = await db.query(query1, [post_id]);
        if (result.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        let path = result[0].img;

        if (req.files && req.files.img) {
            path = await uplodehandler.handleFileUpload(req.files.img, 'post');

            if (result[0].img) {
                await uplodehandler.deleteFile(result[0].img);
            }
        }

        const query2 = 'UPDATE posts SET title = ?, content = ?, img = ? WHERE post_id = ?';
        const values = [title, content, path, post_id];
        await db.query(query2, values);

        res.status(200).json({ message: 'Post updated successfully' });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: err.message });
    }
};

// Delete a post
const deletePost = async (req, res) => {
    try {
        const post_id = req.params.id;
        const query1 = 'select img from posts where post_id = ?';
        const [result] = await db.query(query1, [post_id]);
        if (result.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (result[0].img) {
            await uplodehandler.deleteFile(result[0].img);
        }
        const query2 = 'delete from posts where post_id = ?';
        await db.query(query2, [post_id]);
        res.status(200).json({ message: 'Post deleted successfully' });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
}



// Like a post
const likePost = async (req, res) => {
    try {
        // Extract token and verify it
        const token = req.headers.authorization.split(' ')[1];
        const userid = jwt.verify(token, process.env.JWT_SECRET).id;
        const post_id = req.params.id;
        const likeExistQuery = 'SELECT * FROM likes WHERE user_id = ? AND post_id = ?';
        const [like] = await db.query(likeExistQuery, [userid, post_id]);
        if (like.length > 0) {
            const query = 'delete from likes where user_id = ? and post_id = ?';
            const values = [userid, post_id];
            const [result] = await db.query(query, values);
            res.status(200).json({ message: 'Post unliked successfully' });
        }
        else {
            const query = 'insert into likes (user_id, post_id) values (?,?)';
            const values = [userid, post_id];
            const [result] = await db.query(query, values);
            res.status(200).json({ message: 'Post liked successfully' });
        }

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

// Unlike a post
const unlikePost = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const userid = jwt.verify(token, process.env.JWT_SECRET).id;
        const post_id = req.params.id;
        const query = 'delete from likes where user_id = ? and post_id = ?';
        const values = [userid, post_id];
        db.query(query, values, (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            res.status(200).json({ message: 'Post unliked successfully' });
        })
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
}



// Comment on a post
const commentPost = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const userid = jwt.verify(token, process.env.JWT_SECRET).id;
        const post_id = req.params.id;
        const comment = req.body.comment;
        const query = 'insert into comments (user_id,comments, post_id) values (?,?,?)';
        const values = [userid, comment, post_id];
        const [result] = await db.query(query, values);
        res.status(200).json({ message: 'Comment added successfully' });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

// Delete a comment
const deleteComment = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const userid = jwt.verify(token, process.env.JWT_SECRET).id;
        const commintid = req.params.commentId;
        const query = 'delete from comments where id = ?';
        const values = [commintid];
        const [result] = await db.query(query, values);
        res.status(200).json({ message: 'Comment deleted successfully' });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

// Update a comment
const updateComment = async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const comment = req.body.comment;
        const query = 'update comments set comments = ? where id = ?';
        const values = [comment, commentId];
        const [result] = await db.query(query, values);
        res.status(200).json({ message: 'Comment updated successfully' });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports = {
    createPost,
    getPost,
    updatePost,
    deletePost,
    getPosts,
    likePost,
    unlikePost,
    commentPost,
    deleteComment,
    updateComment
}