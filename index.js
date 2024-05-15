import express, { query } from 'express';
import cors from 'cors';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
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

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

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
app.use(cookieParser());

// verify token middleware 
const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: 'not authorized' });
  };

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: 'unauthorized' });
    }

    req.user = decoded;
    next();
  })
}

// root path
app.get('/', (req, res) => {
  res.send('Hunger Helper server is running');
});

//create Token
app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  console.log(token);

  res
    .cookie("token", token, cookieOptions)
    .send({ success: true });
});

//clear Token
app.post("/logout", async (req, res) => {
  res
    .clearCookie("token", { ...cookieOptions, maxAge: 0 })
    .send({ success: true });
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const foodCollection = client.db('hungerHelperDB').collection('foods');
    const requestedFoodCollection = client.db('hungerHelperDB').collection('requestedFoods');

    // foods related apis
    app.get('/featured_foods', async (req, res) => {
      const filter = { foodStatus: "Available" }
      const options = {
        sort: { foodQuantity: -1 },
      };
      const result = await foodCollection.find(filter, options).limit(6).toArray();
      res.send(result);
    });

    app.get('/food/:id', verifyToken, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    app.get('/foods', async (req, res) => {
      const filter = { foodStatus: "Available" }
      const result = await foodCollection.find(filter).toArray();
      res.send(result);
    });

    app.get('/my_foods', verifyToken, async (req, res) => {
      const email = req.query.donatorEmail;
      if (req.user.userEmail !== email) {
        return res.status(403).send('forbidden');
      }
      const filter = { donatorEmail: email };
      const result = await foodCollection.find(filter).toArray();
      res.send(result)
    });

    app.post('/foods', verifyToken, async (req, res) => {
      const doc = req.body;
      const result = await foodCollection.insertOne(doc);
      res.send(result);
    });

    app.patch('/food/:id', verifyToken, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const doc = req.body;
      const updatedDoc = {
        $set: { ...doc }
      }
      const result = await foodCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    app.delete('/food/:id', verifyToken, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    // apis for requested food
    app.get('/requested_foods', verifyToken, async (req, res) => {
      const email = req.query.userEmail;
      const filter = { userEmail: email };
      const result = await requestedFoodCollection.find(filter).toArray();
      res.send(result)
    });

    app.post('/requested_foods', verifyToken, async (req, res) => {
      const doc = req.body;
      const result = await requestedFoodCollection.insertOne(doc);
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