import { MongoClient } from "mongodb";

const password = encodeURIComponent(process.env.MONGO_PASSWORD.trim());
const connectionString = `mongodb+srv://thesuuri:5f5mGPpxl4MxHCqF@cluster0.6d1pwp8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`; // clustore url
const client = new MongoClient(connectionString);
let conn;
try {
  conn = await client.connect();
  console.log("connection successful");
} catch (e) {
  console.error(e);
}
let db = conn.db("the_suuri");
export default db;
