import express, { query } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';

const app = express();
const port = process.env.PORT || 5000;

// database uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jzumutc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://hunger-helper.web.app",
    "https://hunger-helper.firebaseapp.com",
  ],
  credentials: true,
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hunger Helper server is running');
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const foodCollection = client.db('hungerHelperDB').collection('foods');

    // foods related apis
    app.get('/featured_foods', async (req, res) => {
      const filter = { foodStatus: "Available" }
      const options = {
        sort: { foodQuantity: -1 },
      };
      const result = await foodCollection.find(filter, options).limit(6).toArray();
      res.send(result);
    });

    app.get('/food/:id', async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    app.get('/foods', async (req, res) => {
      const filter = { foodStatus: "Available" }
      const result = await foodCollection.find(filter).toArray();
      res.send(result);
    });

    app.get('/my_foods', async (req, res) => {
      const email = req.query.donatorEmail;
      const filter = { donatorEmail: email };
      const result = await foodCollection.find(filter).toArray();
      res.send(result)
    });

    app.post('/foods', async (req, res) => {
      const doc = req.body;
      const result = await foodCollection.insertOne(doc);
      res.send(result);
    });

    app.patch('/food/:id', async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const doc = req.body;
      const updatedDoc = {
        $set: { ...doc }
      }
      const result = await foodCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Hunger helper server is running on port: ${port}`);
});