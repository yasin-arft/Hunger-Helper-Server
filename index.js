import express from 'express';
import cors from 'cors';
import 'dotenv/config'

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hunger Helper server is running');
});

app.listen(port, () => {
  console.log(`Hunger helper server is running on port: ${port}`);
});