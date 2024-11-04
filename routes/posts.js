import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const dataFilePath = path.join(__dirname, '../data.json');


// Function to read data from JSON file
async function readData() {
    try {
        const data = await fs.readFile(dataFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        throw error;
    }
}

// Function to write data to JSON file
async function writeData(data) {
    try {
        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data:', error);
        throw error;
    }
}

// Loads new post page
router.get('/new', (req, res) => {
    res.render('posts/new.ejs');
});

// Adds new post to website
router.post('/', async (req, res) => {
    const { title, contents, user_id, password } = req.body;
    const data = await readData();

    const user = data.users.find(user => user.user_id === user_id);

    if (user) {
        if (password === user.password) {
            const newPost = {
                blog_id: data.blogs.length + 1,
                username: user.username,
                creator_user_id: user_id,
                password: user.password,
                title,
                content: contents,
                date_created: new Date().toLocaleString()
            };
            data.blogs.push(newPost);
            await writeData(data);
            res.redirect('/blog');
        } else {
            res.send("Password is incorrect");
        }
    } else {
        res.send("User_ID not found, check user_ID and try again.");
    }
});

// Loads edit page with corresponding post
router.get('/edit/:blog_id', async (req, res) => {
    const post_id = parseInt(req.params.blog_id);
    const data = await readData();
    const post = data.blogs.find(post => post.blog_id === post_id);

    if (post) {
        res.render('posts/edit.ejs', { post, post_id });
    } else {
        res.send("Post not found");
    }
});

// Updates old post with new post information
router.post('/edit/:blog_id', async (req, res) => {
    const post_id = parseInt(req.params.blog_id);
    const { title, contents, edit_id, password } = req.body;
    const data = await readData();
    const postIndex = data.blogs.findIndex(post => post.blog_id === post_id);
    const dbAuthorId = data.blogs[postIndex].creator_user_id;

    if (edit_id.trim() === dbAuthorId) {
        const user = data.users.find(user => user.user_id === dbAuthorId);
        if (user.password === password.trim()) {
            data.blogs[postIndex] = {
                ...data.blogs[postIndex],
                creator_name: user.username,
                title,
                content: contents,
                date_edited: new Date().toLocaleString()
            };
            await writeData(data);
            res.redirect('/blog');
        } else {
            res.send("Password is incorrect");
        }
    } else {
        res.send("User_ID does not match, please try again.");
    }
});

// Loads delete page
router.get('/delete/:blog_id', async (req, res) => {
    const post_id = parseInt(req.params.blog_id);
    const data = await readData();
    const post = data.blogs.find(post => post.blog_id === post_id);
    
    if (post) {
        res.render('posts/delete.ejs', { post_id, post_title: post.title });
    } else {
        res.send("Post not found");
    }
});

// Deletes corresponding post
router.post('/delete/:blog_id', async (req, res) => {
    const post_id = parseInt(req.params.blog_id);
    const { edit_id, password } = req.body;
    const data = await readData();
    const postIndex = data.blogs.findIndex(post => post.blog_id === post_id);

    if (postIndex !== -1) {
        const dbAuthorId = data.blogs[postIndex].creator_user_id;
        const user = data.users.find(user => user.user_id === dbAuthorId);
        
        if (edit_id.trim() === dbAuthorId && user.password === password.trim()) {
            data.blogs.splice(postIndex, 1);
            await writeData(data);
            res.redirect('/blog');
        } else {
            res.send("User_ID does not match or password is incorrect.");
        }
    } else {
        res.send("Post not found");
    }
});

export default router;