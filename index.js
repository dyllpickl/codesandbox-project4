import express from "express";
import bodyParser from "body-parser";
import postsRoute from "./routes/posts.js";
import fs from "fs/promises";

const app = express();
const port = 3000;
const dataFilePath = './data.json';

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/posts', postsRoute);

// Function to read data from JSON file
async function readData() {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
}

// Function to write data to JSON file
async function writeData(data) {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
}

// Get posts function
async function getPosts() {
    const data = await readData();
    return data.blogs.map(post => ({
        blog_id: post.blog_id,
        author: post.username,
        author_id: post.creator_user_id,
        title: post.title,
        content: post.content,
        creationDate: post.date_created,
        editDate: post.date_edited,
    }));
}

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.get('/blog', async (req, res) => {
    const postsArray = await getPosts();
    res.render('blog.ejs', { posts: postsArray });
});

app.post('/register', async (req, res) => {
    const user_id = req.body.user_id;
    const username = req.body.username;
    const password = req.body.password;
    
    const data = await readData();
    const userExists = data.users.some(user => user.user_id === user_id);

    if (userExists) {
        res.send("User_ID already exists, try another user_ID.");
    } else {
        data.users.push({ user_id, username, password });
        await writeData(data);
        res.redirect('/');
    }
});

app.post('/login', async (req, res) => {
    const user_id = req.body.user_id;
    const password = req.body.password;

    const data = await readData();
    const user = data.users.find(user => user.user_id === user_id);

    if (user) {
        if (password === user.password) {
            const postsArray = await getPosts();
            res.render('blog.ejs', { posts: postsArray });
        } else {
            res.send("Password is incorrect");
        }
    } else {
        res.send("User_ID not found, please try again or register an account.");
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});