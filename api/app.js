require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;

const cors = require("cors");
app.use(
  cors({
    origin: "*",
  })
);

const knex = require("knex")({
  client: "mysql",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
});

const bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(
  bodyParser.json({
    limit: "8mb",
  })
);

app.get("/participants", async (req, res) => {
  const count = knex
    .select("club")
    .from("participants")
    .count("club", { as: "count" })
    .groupBy("club")
    .as("counts");

  const clubs = await knex
    .select("clubs.*", "counts.count")
    .leftJoin(count, "counts.club", "clubs.name")
    .orderBy("count", "desc")
    .orderBy("name", "asc")
    .limit(5)
    .from("clubs");

  return res.send(clubs);
});

app.post("/votes", async (req, res) => {
  try {
    const name = req.body.name;
    const phone = req.body.phone;
    const email = req.body.email;
    const candidate = req.body.candidate;

    let date = new Date()

    const haveVoteToday = await knex("votes")
      // TODO: tambah batasan waktu
      // .where("created_at", ">=", date.setHours(0, 0, 0, 0))
      // .where("created_at", "<", date.setHours(23, 59, 59))
      .where(q => q.where('email', email).orWhere('phone', phone))
      .first();

    if (haveVoteToday) {
      return res
        .status(400)
        .send({ message: "Vote Minimal 1 kali per email/nomor HP" });
    }

    const id = await knex("votes").insert({
      name,
      phone,
      email,
      candidate,
    });

    res.json({
      id: id[0],
      name,
      phone,
      email,
      candidate,
    });
  } catch (e) {
    console.log(e);
    // next(e)
  }
});

app.get("/clubs", async (req, res) => {
  const clubs = await knex.from("clubs").select("*").orderBy("name", "asc");

  return res.send(clubs);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
