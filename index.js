const express = require('express');
const {
    MongoClient
} = require('mongodb');
const cors = require('cors');
const formData = require('express-form-data');
var ObjectId = require('mongodb').ObjectID;
// const fileUpload = require("express-fileupload");
var fs = require('fs-extra')
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}))
app.use(formData.parse());
app.use('/files', express.static('files'));
// app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.chvpa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


async function run() {
    try {
        await client.connect();
        console.log('DB connected.');

        const database = client.db("TestDb");
        const users = database.collection("users");
        const events = database.collection("events");
        const carts = database.collection("carts");

        app.get('/users', async (req, res) => {
            const cursor = users.find();
            const results = await cursor.toArray();
            res.send([results, cursor, 'hi']);
        })

        // events routes
        app.get('/events', async (req, res) => {
            const cursor = events.find();
            const results = await cursor.toArray();
            res.json(results);
        })

        app.post('/event', async (req, res) => {
            let form_data = {
                ...req.body
            };
            form_data.image = '';
            if (req.files) {
                const file = req.files.image;
                let file_name = parseInt(Math.random() * 1000) + file.name;
                const path = __dirname + "/files/" + file_name;
                fs.move(file.path, path, function (err) {
                    if (err) return console.error(err)
                    console.log("success!")
                })
                form_data.image = "files/" + file_name;
            }
            const result = await events.insertOne(form_data);
            console.log(form_data, result);
            // console.log(req.body, req.files);
            res.send(form_data);
        })

        app.delete('/delete-event/:id', async (req, res) => {
            const query = {
                _id: ObjectId(req.params.id)
            }
            const result = await events.deleteOne(query);
            res.json(result);
        })

        // cart routes
        app.get('/carts', async (req, res) => {
            const cursor = carts.find();
            const results = await cursor.toArray();
            res.json(results);
        })

        app.get('/my-cart/:email', async (req, res) => {
            const cursor = carts.find({email:req.params.email});
            const results = await cursor.toArray();
            // console.log(results);
            res.json(results);
        })

        app.delete('/delete-cart/:id', async (req, res) => {
            const query = {
                _id: ObjectId(req.params.id)
            }
            const result = await carts.deleteOne(query);
            res.json(result);
        })
        
        // accept cart
        app.get('/accept-cart/:id', async (req, res) => {
            const query = {
                _id: ObjectId(req.params.id)
            }
            const result = await carts.updateOne(query,{
                "$set": {
                    status: 'accepted'
                }
            });
            res.json(result);
        })

        // save cart
        app.post('/cart', async (req, res) => {
            let form_data = {
                ...req.body
            };
            const result = await carts.insertOne(form_data);
            console.log(form_data, result._id);
            // console.log(req.body, req.files);
            res.json(form_data);
        })

    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/',(req,res)=>{
    res.send('running node server');
})

app.listen(port, () => {
    console.log('server started on. ' + port);
})